// supabase/functions/generate-monthly-bills/index.ts
// Runs on the 1st of every month via pg_cron
// Creates payment_records for all active tenants, sends ntfy notification

// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2/dist/module/index.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NTFY_TOPIC = Deno.env.get("NTFY_TOPIC")!;           // e.g. "building-cyril-x9k2m4p7q3"

Deno.serve(async (req) => {
  // Only allow POST requests (pg_cron calls via HTTP POST)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Auth is handled by Supabase gateway (JWT verification)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const monthName = MONTH_NAMES[month - 1];

  try {
    // 1. Fetch all active tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, unit_id, rent, payment_status")
      .eq("status", "Active");

    if (tenantsError) throw tenantsError;
    if (!tenants || tenants.length === 0) {
      return new Response(JSON.stringify({ message: "No active tenants found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. For each tenant, create a payment record if one doesn't exist yet
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const tenant of tenants) {
      // Check if record already exists for this month/year
      const { data: existing, error: checkError } = await supabase
        .from("payment_records")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (checkError) {
        errors.push(`Tenant ${tenant.id}: ${checkError.message}`);
        continue;
      }

      if (existing) {
        skipped++;
        continue;
      }

      // Create new payment record
      const { error: insertError } = await supabase
        .from("payment_records")
        .insert({
          tenant_id: tenant.id,
          unit_id: tenant.unit_id,
          month,
          year,
          amount: tenant.rent,
          water_bill: 0,
          electricity_bill: 0,
          total_due: tenant.rent, // will be updated when bills are added
          status: "Unpaid",
        });

      if (insertError) {
        errors.push(`Tenant ${tenant.id}: ${insertError.message}`);
      } else {
        created++;
      }
    }

    // 3. Send ntfy notification
    const notifTitle = `${monthName} ${year} bills generated`;
    const notifBody = [
      `${created} payment records created.`,
      `Open the app and go to Bills → add water and electricity for ${monthName}.`,
      errors.length > 0 ? `⚠️ ${errors.length} error(s): ${errors.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const ntfyRes = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        "Title": notifTitle,
        "Priority": "default",
        "Tags": "house",
        "Content-Type": "text/plain",
      },
      body: notifBody,
    });

    const ntfyOk = ntfyRes.ok;

    const result = {
      success: true,
      month: monthName,
      year,
      tenants_processed: tenants.length,
      records_created: created,
      records_skipped: skipped,
      errors,
      notification_sent: ntfyOk,
    };

    console.log("generate-monthly-bills result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("generate-monthly-bills error:", message);

    // Still try to send a failure notification
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        "Title": "Bill generation FAILED",
        "Priority": "high",
        "Tags": "warning",
        "Content-Type": "text/plain",
      },
      body: `Error on ${monthName} ${year}: ${message}`,
    }).catch(() => {}); // don't throw if ntfy also fails

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});