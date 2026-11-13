<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Business extends Model
{
    protected $primaryKey = 'business_id';

    protected $fillable = [
        'owner_id',
        'category_id',
        'shop_name',
        'operation_type',
        'shop_address',
        'shop_moo',
        'shop_phone',
        'business_area',
        'machine_power',
        'worker_count',
        'inspection_status',
        'workflow_status',
        'request_date',
        'request_no',
    ];

    protected $casts = [
        'request_date' => 'date',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class, 'owner_id', 'owner_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BusinessCategory::class, 'category_id', 'category_id');
    }

    public function licenses(): HasMany
    {
        return $this->hasMany(License::class, 'business_id', 'business_id');
    }

    public function latestLicense(): HasOne
    {
        // ใช้ license_id เป็น tiebreaker — ใบที่สร้างล่าสุดเสมอ
        return $this->hasOne(License::class, 'business_id', 'business_id')->latestOfMany('license_id');
    }

    public function inspectionRecords(): HasMany
    {
        return $this->hasMany(InspectionRecord::class, 'business_id', 'business_id');
    }
}

