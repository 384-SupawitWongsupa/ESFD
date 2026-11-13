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
        Schema::table('businesses', function (Blueprint $table) {
            if (!Schema::hasColumn('businesses', 'workflow_status')) {
                $table->string('workflow_status', 30)->default('pending_request')->after('inspection_status')->index();
            }
            if (!Schema::hasColumn('businesses', 'request_date')) {
                $table->date('request_date')->nullable()->after('workflow_status');
            }
            if (!Schema::hasColumn('businesses', 'request_no')) {
                $table->string('request_no', 50)->nullable()->after('request_date');
            }
        });

        // กำหนดสถานะสำหรับข้อมูลเดิม 39 กิจการที่มีการออกตรวจแล้ว
        // กิจการที่มีการตรวจและมีใบอนุญาตแล้ว แต่ยังไม่ได้พิมพ์ ให้เป็น 'pending_print'
        DB::statement("UPDATE businesses SET workflow_status = 'pending_print' WHERE business_id IN (SELECT DISTINCT business_id FROM inspection_records)");

        // หากมีบันทึกที่พิมพ์แล้ว ให้เป็น 'completed'
        DB::statement("UPDATE businesses SET workflow_status = 'completed' WHERE business_id IN (SELECT DISTINCT business_id FROM licenses WHERE is_printed = 1)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['workflow_status', 'request_date', 'request_no']);
        });
    }
};

