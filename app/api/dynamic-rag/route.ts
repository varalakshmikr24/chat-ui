import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // Make sure this URL matches the Python endpoint exactly: /api/dynamic-rag
        const pythonBackendResponse = await fetch("http://127.0.0.1:8000/api/dynamic-rag", {
            method: "POST",
            body: formData,
        });

        if (!pythonBackendResponse.ok) {
            const errorText = await pythonBackendResponse.text();
            console.error("Python error traceback output:", errorText);
            throw new Error(`Python service responded with status: ${pythonBackendResponse.status}`);
        }

        const data = await pythonBackendResponse.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Proxy route error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
