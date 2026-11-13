<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. เพิ่มสถานะการออกตรวจใน businesses (pending = ยังไม่ได้ออกตรวจ, inspected = ออกตรวจแล้ว)
        if (!Schema::hasColumn('businesses', 'inspection_status')) {
            Schema::table('businesses', function (Blueprint $table) {
                $table->string('inspection_status', 30)->default('pending')->after('worker_count')->index();
            });
        }

        // 2. เพิ่มสถานะการพิมพ์ใบ อภ.๒ ใน licenses
        if (!Schema::hasColumn('licenses', 'is_printed')) {
            Schema::table('licenses', function (Blueprint $table) {
                $table->boolean('is_printed')->default(false)->after('status')->index();
                $table->timestamp('printed_at')->nullable()->after('is_printed');
            });
        }

        // 3. ปรับปรุงข้อมูลเดิม: กิจการใดที่มีบันทึกการตรวจแล้ว ให้เป็น inspected, ที่ไม่มีให้เป็น pending
        DB::statement("UPDATE businesses SET inspection_status = 'inspected' WHERE business_id IN (SELECT DISTINCT business_id FROM inspection_records)");
        DB::statement("UPDATE businesses SET inspection_status = 'pending' WHERE business_id NOT IN (SELECT DISTINCT business_id FROM inspection_records)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('inspection_status');
        });

        Schema::table('licenses', function (Blueprint $table) {
            $table->dropColumn(['is_printed', 'printed_at']);
        });
    }
};

