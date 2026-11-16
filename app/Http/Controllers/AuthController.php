<?php

namespace App\Http\Controllers;

use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $ip = $request->ip();
        $userAgent = $request->userAgent();

        $user = User::where('username', $credentials['username'])
            ->orWhere('email', $credentials['username'])
            ->first();

        // 1. กรณีไม่พบผู้ใช้งาน หรือ รหัสผ่านไม่ถูกต้อง
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            LoginLog::create([
                'user_id' => $user?->id,
                'username' => $credentials['username'],
                'name' => $user?->name,
                'role' => $user?->role,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'status' => 'failed',
                'failure_reason' => $user ? 'รหัสผ่านไม่ถูกต้อง' : 'ไม่พบชื่อผู้ใช้งานในระบบ',
                'login_at' => now(),
            ]);

            return back()->withErrors([
                'username' => 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',
            ]);
        }

        // 2. กรณีบัญชียังไม่อนุมัติ (Pending)
        if ($user->status === 'pending') {
            LoginLog::create([
                'user_id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'role' => $user->role,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'status' => 'failed',
                'failure_reason' => 'บัญชีอยู่ระหว่างรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ',
                'login_at' => now(),
            ]);

            return back()->withErrors([
                'username' => 'บัญชีของท่านอยู่ระหว่างรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ',
            ]);
        }

        // 3. กรณีบัญชีถูกระงับสิทธิ์ (Revoked)
        if ($user->status === 'revoked') {
            LoginLog::create([
                'user_id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'role' => $user->role,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'status' => 'failed',
                'failure_reason' => 'บัญชีถูกระงับสิทธิ์การใช้งาน',
                'login_at' => now(),
            ]);

            return back()->withErrors([
                'username' => 'บัญชีของท่านถูกระงับสิทธิ์การใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
            ]);
        }

        // 4. เข้าสู่ระบบสำเร็จ (Success)
        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        LoginLog::create([
            'user_id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'role' => $user->role,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'status' => 'success',
            'failure_reason' => null,
            'login_at' => now(),
        ]);

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
