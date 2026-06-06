import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { requireStaffRole } from "@/lib/server-auth";
import EvidenceTable from "@/components/EvidenceTable";

export default async function VerificationPage({
  
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaffRole(
    ["manager", "supervisor", "floor_staff", "head_office"],
    "/verification"
  );
  const { id } = await params;

  const { data: feedback } = await supabase
    .from("feedback")
    .select("*, stores(*)")
    .eq("id", id)
    .single();

  const { data: verification } = await supabase
    .from("verification_results")
    .select("*")
    .eq("feedback_id", id)
    .single();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("feedback_id", id)
    .maybeSingle();

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">
          Feedback verification result
        </h1>

        <p className="mt-2 text-gray-600">
          Internal staff view. The system uses AI to understand the feedback,
          verifies the claim against store data, and creates an action if needed.
        </p>

        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Original feedback</h2>

          <p className="mt-3 text-gray-700">{feedback?.complaint}</p>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Store</p>
              <p className="font-medium">{feedback?.stores?.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p className="font-medium">{feedback?.rating}/5</p>
            </div>

            <div>
            <p className="text-sm text-gray-500">Recommendation score</p>
              <p className="font-medium">{feedback?.nps}/10</p>
            </div>

            <div>
            <p className="text-sm text-gray-500">AI extracted product context</p>
              <p className="font-medium">
                {feedback?.product_name} {feedback?.color} {feedback?.size}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">AI + data verification</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Issue type</p>
              <p className="mt-1 font-semibold">{verification?.issue_type}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Verification status</p>
              <p className="mt-1 font-semibold">
                {verification?.verification_status}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Verification confidence</p>
              <p className="mt-1 font-semibold">
                {verification?.confidence_score}%
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm text-gray-500">Extracted claim</p>
            <pre className="mt-2 overflow-auto rounded-xl bg-gray-950 p-4 text-sm text-white">
             
                {JSON.stringify(
                  {
                    ...verification.extracted_claim,
                    ai_extraction_confidence: verification.extracted_claim?.confidence_score,
                    confidence_score: undefined,
                  },
                  null,
                  2
                )}
              
            </pre>
          </div>

          <div className="mt-5">
            <p className="text-sm text-gray-500">Evidence from store data</p>
             <div className="mt-2">
                <EvidenceTable evidence={verification?.evidence} />
              </div>
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Recommended action</p>
            <p className="mt-1 font-medium">
              {verification?.recommended_action}
            </p>
          </div>
        </section>

        {task ? (
          <section className="mt-6 rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Task created</h2>

            <p className="mt-3 font-medium">{task.title}</p>
            <p className="mt-2 text-gray-600">{task.description}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <p className="font-medium">{task.priority}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Assigned role</p>
                <p className="font-medium">{task.assigned_role}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Assigned to</p>
                <p className="font-medium">{task.assigned_to || "Unassigned"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{task.status}</p>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}