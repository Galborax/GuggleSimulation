import SynthesisReport from "@/components/SynthesisReport";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function SynthesisPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">📋 Executive Blueprint</h1>
        <p className="text-gray-400 mt-1">AI-generated investor-ready blueprint with SWOT, financial outlook, and ASEAN expansion strategy</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Executive Blueprint</CardTitle>
          <CardDescription>Powered by Gemini 2.5 Flash Lite · Export as text</CardDescription>
        </CardHeader>
        <CardContent>
          <SynthesisReport />
        </CardContent>
      </Card>
    </div>
  );
}
