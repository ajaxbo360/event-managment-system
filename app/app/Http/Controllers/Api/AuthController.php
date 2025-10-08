<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // <-- add this
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{

    /**
     * Register user
     */
    public function register(Request $request)
    {
        Log::info('Request Data:', $request->all()); // <-- debug
        dd($request->all()); // optional, stops execution and shows data

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
        ]);
        Log::info('Request Data:', $request->all()); // <-- debug
        dd($request->all()); // optional, stops execution and sho
        // if (User::where('email', $request->email)->exists()) {
        //     return response()->json(['message' => 'Email already registered'], 409);
        // }



        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }
    /**
     * Login user
     */
    public function login(LoginUserRequest $request)
    {

        $user = User::where('email', $request->email)->first();

        // if (User::where('email', $request->email)->exists()) {
        //     return response()->json(['message' => 'Email already registered'], 409);
        // }

        // check
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                "email" => ['The provided credentials are incorrect. ']
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
