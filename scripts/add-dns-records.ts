import { Vercel } from "@vercel/sdk";

const client = new Vercel({ bearerToken: process.env.VERCEL_TOKEN });
const domain = "ninthstreetdigital.com";
const teamId = process.env.VERCEL_TEAM_ID || undefined;

const records = [
  {
    type: "TXT" as const,
    name: "resend._domainkey",
    value:
      "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCvv1gI9fjCDAnytWOeb866M1xTgGy2HdcwjAUXV5ZOM5Pr81Is8BDL0OO1sgFWgNQVv+AHA12bJMzq3Gftk6b6FuEZa5nwUcJUeJ7LBQ5gM/+tA6V2CRnjiqyJhuuVdwf4YyqPh6CHWH2GVIFY2Wfy7xf+Pk/nwoRqvNEkktkg0QIDAQAB",
  },
];

for (const record of records) {
  try {
    const result = await client.dns.createRecord({
      domain,
      teamId,
      requestBody: {
        type: record.type,
        name: record.name,
        value: record.value,
        ttl: 60,
      } as any,
    });
    console.log("done", record.type, record.name, "->", result.uid);
  } catch (e: any) {
    console.log("fail", record.type, record.name, "->", e.message);
  }
}
