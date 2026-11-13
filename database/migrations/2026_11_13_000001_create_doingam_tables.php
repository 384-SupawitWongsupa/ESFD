<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. หมวดหมู่ประเภทกิจการหลัก
        Schema::create('business_categories', function (Blueprint $table) {
            $table->increments('category_id');
            $table->string('category_name', 100)->unique();
            $table->timestamps();
        });

        // 2. ข้อมูลผู้ประกอบการ / เจ้าของ / นิติบุคคล
        Schema::create('owners', function (Blueprint $table) {
            $table->increments('owner_id');
            $table->string('citizen_id', 20)->nullable()->index();
            $table->string('juristic_id', 50)->nullable()->index();
            $table->string('owner_name', 255)->index();
            $table->string('phone', 50)->nullable()->index();
            $table->string('office_address', 255)->nullable();
            $table->string('moo', 10)->nullable();
            $table->string('subdistrict', 100)->default('ดอยงาม');
            $table->string('district', 100)->default('พาน');
            $table->string('province', 100)->default('เชียงราย');
            $table->timestamps();
        });

        // 3. ข้อมูลสถานประกอบการ / ร้านค้า
        Schema::create('businesses', function (Blueprint $table) {
            $table->increments('business_id');
            $table->unsignedInteger('owner_id');
            $table->unsignedInteger('category_id');
            $table->string('shop_name', 255)->nullable()->index();
            $table->text('operation_type'); // รายละเอียดประเภทกิจการ เช่น ร้านของชำ, อู่ซ่อมรถ
            $table->string('shop_address', 255)->nullable();
            $table->string('shop_moo', 10)->nullable();
            $table->string('shop_phone', 50)->nullable();
            $table->string('business_area', 100)->nullable();
            $table->string('machine_power', 100)->nullable();
            $table->string('worker_count', 50)->nullable();
            $table->timestamps();

            $table->foreign('owner_id')->references('owner_id')->on('owners')->onDelete('cascade');
            $table->foreign('category_id')->references('category_id')->on('business_categories')->onDelete('restrict');
        });

        // 4. ข้อมูลใบอนุญาตและการชำระเงิน
        Schema::create('licenses', function (Blueprint $table) {
            $table->increments('license_id');
            $table->unsignedInteger('business_id');
            $table->decimal('fee', 10, 2)->default(0.00);
            $table->string('receipt_book', 50)->nullable();
            $table->string('receipt_no', 50)->nullable();
            $table->date('receipt_date')->nullable();
            $table->date('expire_date')->nullable()->index();
            $table->string('status', 20)->default('active')->index(); // 'active', 'expired', 'renewed'
            $table->timestamps();

            $table->foreign('business_id')->references('business_id')->on('businesses')->onDelete('cascade');
        });

        // 5. รอบการออกตรวจสุขลักษณะ
        Schema::create('inspection_rounds', function (Blueprint $table) {
            $table->increments('round_id');
            $table->string('round_name', 100)->unique();
            $table->date('inspection_date')->index();
            $table->timestamps();
        });

        // 6. บันทึกผลการออกตรวจรายสถานประกอบการ
        Schema::create('inspection_records', function (Blueprint $table) {
            $table->increments('record_id');
            $table->unsignedInteger('round_id');
            $table->unsignedInteger('business_id');
            $table->text('condition_4_3')->nullable(); // เงื่อนไขพิเศษ 4.3
            $table->text('condition_4_4')->nullable(); // เงื่อนไขพิเศษ 4.4
            $table->text('file_url')->nullable(); // ลิงก์ไฟล์แนบ Google Drive
            $table->text('notes')->nullable(); // หมายเหตุและผู้ตรวจ
            $table->timestamps();

            $table->foreign('round_id')->references('round_id')->on('inspection_rounds')->onDelete('cascade');
            $table->foreign('business_id')->references('business_id')->on('businesses')->onDelete('cascade');
            $table->unique(['round_id', 'business_id'], 'uq_round_business');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_records');
        Schema::dropIfExists('inspection_rounds');
        Schema::dropIfExists('licenses');
        Schema::dropIfExists('businesses');
        Schema::dropIfExists('owners');
        Schema::dropIfExists('business_categories');
    }
};

