<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class License extends Model
{
    protected $primaryKey = 'license_id';

    protected $fillable = [
        'business_id',
        'fee',
        'receipt_book',
        'receipt_no',
        'receipt_date',
        'expire_date',
        'status',
        'is_printed',
        'printed_at',
    ];

    protected $casts = [
        'fee' => 'decimal:2',
        'receipt_date' => 'date',
        'expire_date' => 'date',
        'is_printed' => 'boolean',
        'printed_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id', 'business_id');
    }
}

