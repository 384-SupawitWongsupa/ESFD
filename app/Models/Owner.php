<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Owner extends Model
{
    protected $primaryKey = 'owner_id';

    protected $fillable = [
        'citizen_id',
        'juristic_id',
        'owner_name',
        'phone',
        'office_address',
        'moo',
        'subdistrict',
        'district',
        'province',
    ];

    public function businesses(): HasMany
    {
        return $this->hasMany(Business::class, 'owner_id', 'owner_id');
    }
}

