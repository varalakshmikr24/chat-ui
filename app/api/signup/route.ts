import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    // 1. Parse request body
    const body = await req.json();
    const { name, email, password } = body;

    // 2. Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // 3. Connect to Database
    try {
      await dbConnect();
    } catch (dbError) {
      console.error("Database connection failed during signup:", dbError);
      return NextResponse.json(
        { message: "Database connection failed" },
        { status: 500 }
      );
    }

    // 4. Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Create User
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      provider: "credentials",
    });

    // 7. Success response
    return NextResponse.json(
      { message: "Account created successfully", userId: newUser._id },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Signup Route Error:", error);
    
    // Check if it's a specific MongoDB duplicate error or something else
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
