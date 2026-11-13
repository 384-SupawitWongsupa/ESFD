<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionRecord extends Model
{
    protected $primaryKey = 'record_id';

    protected $fillable = [
        'round_id',
        'business_id',
        'condition_4_3',
        'condition_4_4',
        'file_url',
        'notes',
    ];

    public function round(): BelongsTo
    {
        return $this->belongsTo(InspectionRound::class, 'round_id', 'round_id');
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'business_id', 'business_id');
    }
}

