
const port = 3001;
const baseUrl = `http://localhost:${port}`;
const webhookPort = 3002;
const webhookUrl = `http://localhost:${webhookPort}/webhook`;

async function startWebhookServer() {
  const handler = async (req: Request) => {
    if (req.url.endsWith("/webhook") && req.method === "POST") {
      const buffer = await req.arrayBuffer();
      console.log(`[Webhook] Received PDF with size: ${buffer.byteLength} bytes`);
      return new Response("OK", { status: 200 });
    }
    return new Response("Not Found", { status: 404 });
  };
  
  console.log(`Starting webhook server on port ${webhookPort}`);
  Deno.serve({ port: webhookPort }, handler);
}

// Start webhook server in background logic is tricky in script, better to just run it or assume it runs.
// We can use a promise to wait for webhook.

async function testPdfGeneration() {
  console.log("Testing PDF generation...");
  
  // Test Sync
  console.log("1. Test Sync PDF Generation (Google Home)");
  const res1 = await fetch(`${baseUrl}/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://www.google.com",
    }),
  });
  
  if (res1.ok) {
     const blob = await res1.blob();
     console.log(`Sync PDF generated. Size: ${blob.size}`);
     if (blob.size < 1000) throw new Error("Sync PDF too small");
  } else {
     console.error("Sync generation failed", res1.status, await res1.text());
  }

  // Test Async / Webhook
  console.log("2. Test Async with Webhook");
  const res2 = await fetch(`${baseUrl}/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://example.com",
      webhookUrl: webhookUrl,
    }),
  });
  
  console.log("Async request status:", res2.status);
  if (res2.status !== 201 && res2.status !== 202 && res2.status !== 200) { // Controller returns 201 Created by default
      console.error("Async request failed", await res2.text());
  } else {
      console.log("Async request accepted.");
  }
}

// To run this properly, we need to run the server in a separate process or in the same if using Deno.serve?
// But existing app uses Danet.
// I will just define the test script to be run separately while I run the server.

if (import.meta.main) {
   // Start webhook server
   startWebhookServer();
   
   // Wait a bit for server to be ready (user must have launched it)
   setTimeout(() => {
       testPdfGeneration();
   }, 2000);
}
