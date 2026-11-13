<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Owner;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $keyword = trim($request->query('q', ''));
        $citizenId = trim($request->query('citizen_id', ''));

        $query = Owner::with([
            'businesses' => function ($q) {
                $q->with([
                    'category',
                    'licenses' => function ($l) {
                        $l->latest('expire_date');
                    },
                    'inspectionRecords' => function ($ir) {
                        $ir->with('round')->latest();
                    }
                ]);
            }
        ]);

        if (!empty($citizenId)) {
            // ค้นหาเจาะจงจากเลขบัตรประชาชน (Smart Card Instant Search)
            $query->where('citizen_id', $citizenId);
        } elseif (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {
                $q->where('owner_name', 'like', "%{$keyword}%")
                  ->orWhere('citizen_id', 'like', "%{$keyword}%")
                  ->orWhere('juristic_id', 'like', "%{$keyword}%")
                  ->orWhere('phone', 'like', "%{$keyword}%")
                  ->orWhere('office_address', 'like', "%{$keyword}%")
                  ->orWhereHas('businesses', function ($bq) use ($keyword) {
                      $bq->where('shop_name', 'like', "%{$keyword}%")
                         ->orWhere('operation_type', 'like', "%{$keyword}%")
                         ->orWhere('shop_address', 'like', "%{$keyword}%")
                         ->orWhere('shop_moo', 'like', "%{$keyword}%");
                  });
            });
        } else {
            // หากไม่ได้ระบุคำค้นหา ให้แสดงผล 15 รายการแรก
            $query->latest();
        }

        $owners = $query->paginate(10)->withQueryString();
        $rounds = \App\Models\InspectionRound::orderBy('inspection_date', 'desc')->get();

        return Inertia::render('Search/Index', [
            'owners' => $owners,
            'rounds' => $rounds,
            'filters' => [
                'q' => $keyword,
                'citizen_id' => $citizenId,
            ],
        ]);
    }
}

