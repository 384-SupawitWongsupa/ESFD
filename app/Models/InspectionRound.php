<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionRound extends Model
{
    protected $primaryKey = 'round_id';

    protected $fillable = [
        'round_name',
        'inspection_date',
    ];

    protected $casts = [
        'inspection_date' => 'date',
    ];

    public function inspectionRecords(): HasMany
    {
        return $this->hasMany(InspectionRecord::class, 'round_id', 'round_id');
    }
}

