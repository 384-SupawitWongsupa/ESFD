<?php

namespace App\Http\Controllers;

use App\Models\LoginLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        $users = User::orderBy('status', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:users,email',
            'position' => 'required|string|max:100',
            'role' => 'required|in:admin,staff',
            'password' => 'required|string|min:6',
        ]);

        User::create([
            'username' => $validated['username'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'position' => $validated['position'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'status' => 'approved',
        ]);

        return back()->with('success', "เพิ่มเจ้าหน้าที่ {$validated['name']} เข้าสู่ระบบเรียบร้อยแล้ว");
    }

    public function approve($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'approved']);

        return back()->with('success', "อนุมัติสิทธิ์การใช้งานของ {$user->name} เรียบร้อยแล้ว");
    }

    public function revoke($id)
    {
        $user = User::findOrFail($id);
        
        // ไม่อนุญาตให้ระงับตัวเอง
        if (auth()->id() === $user->id) {
            return back()->with('error', 'ไม่สามารถระงับสิทธิ์บัญชีของตนเองได้');
        }

        $user->update(['status' => 'revoked']);

        return back()->with('success', "ระงับสิทธิ์การใช้งานของ {$user->name} เรียบร้อยแล้ว");
    }

    public function resetPassword(Request $request, $id)
    {
        $validated = $request->validate([
            'new_password' => 'required|string|min:6',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return back()->with('success', "เปลี่ยนรหัสผ่านของ {$user->name} สำเร็จ");
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if (auth()->id() === $user->id) {
            return back()->with('error', 'ไม่สามารถลบบัญชีของตนเองได้');
        }

        $user->delete();

        return back()->with('success', "ลบบัญชี {$user->name} เรียบร้อยแล้ว");
    }

    /**
     * แสดงประวัติและบันทึกการเข้าระบบ (Login Logs) สำหรับ Admin
     */
    public function logs(Request $request)
    {
        $query = LoginLog::with('user')->orderBy('login_at', 'desc');

        // ค้นหาตามคำค้น (username, name, ip)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        // กรองตามสถานะ (success, failed)
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // กรองตามระดับสิทธิ์ (admin, staff)
        if ($role = $request->input('role')) {
            if ($role !== 'all') {
                $query->where('role', $role);
            }
        }

        // กรองตามวันที่
        if ($date = $request->input('date')) {
            $query->whereDate('login_at', $date);
        }

        $logs = $query->paginate(20)->withQueryString();

        // สรุปสถิติ
        $stats = [
            'total' => LoginLog::count(),
            'success' => LoginLog::where('status', 'success')->count(),
            'failed' => LoginLog::where('status', 'failed')->count(),
            'today' => LoginLog::whereDate('login_at', Carbon::today())->count(),
        ];

        return Inertia::render('Admin/Logs', [
            'logs' => $logs,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all'),
                'role' => $request->input('role', 'all'),
                'date' => $request->input('date', ''),
            ],
            'stats' => $stats,
        ]);
    }
}
