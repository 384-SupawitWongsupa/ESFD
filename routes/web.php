<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ExpirationController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\PendingPrintController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SmartCardController;
use Illuminate\Support\Facades\Route;

// Authentication (Guest)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected System Routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // 1. Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // 2. Smart Search & Directory
    Route::get('/search', [SearchController::class, 'index'])->name('search.index');

    // 3. New Business Registration
    Route::get('/businesses/create', [BusinessController::class, 'create'])->name('businesses.create');
    Route::post('/businesses', [BusinessController::class, 'store'])->name('businesses.store');
    Route::post('/businesses/{id}/issue-request', [BusinessController::class, 'issueRequest'])->name('businesses.issueRequest');
    Route::get('/businesses/{id}', [BusinessController::class, 'show'])->name('businesses.show');
    Route::delete('/businesses/{id}', [BusinessController::class, 'destroy'])->name('businesses.destroy');
    Route::delete('/owners/{id}', [BusinessController::class, 'destroyOwner'])->name('owners.destroy');

    // 4. Inspection Workflow
    Route::get('/inspections', [InspectionController::class, 'index'])->name('inspections.index');
    Route::post('/inspections/rounds', [InspectionController::class, 'storeRound'])->name('inspections.storeRound');
    Route::post('/inspections/record', [InspectionController::class, 'recordInspection'])->name('inspections.record');

    // 5. Expiration & Alerts
    Route::get('/expirations', [ExpirationController::class, 'index'])->name('expirations.index');
    Route::get('/expirations/export', [ExpirationController::class, 'exportExcel'])->name('expirations.export');

    // 6. Documents & Printing
    Route::get('/documents/preview/{businessId}', [DocumentController::class, 'preview'])->name('documents.preview');
    Route::post('/documents/after-print/{businessId}', [DocumentController::class, 'afterPrint'])->name('documents.after-print');
    Route::get('/documents/app-template/{businessId}/pdf', [DocumentController::class, 'appTemplatePdf'])->name('documents.appTemplate.pdf');
    Route::get('/documents/aph2/{businessId}/pdf', [DocumentController::class, 'aph2Pdf'])->name('documents.aph2.pdf');
    Route::get('/documents/aph2/{businessId}/word', [DocumentController::class, 'aph2Word'])->name('documents.aph2.word');
    Route::get('/documents/sth2/{businessId}/pdf', [DocumentController::class, 'sth2Pdf'])->name('documents.sth2.pdf');
    Route::get('/documents/batch-zip/{ownerId}', [DocumentController::class, 'batchZip'])->name('documents.batch.zip');

    // 7. Smart Card Reader API (Real USB Hardware & Mock)
    Route::get('/api/smartcard/read', [SmartCardController::class, 'readCard'])->name('api.smartcard.read');
    Route::get('/api/smartcard/mock', [SmartCardController::class, 'mockCard'])->name('api.smartcard.mock');

    // 8. Admin Management
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/users', [AdminController::class, 'index'])->name('users');
        Route::post('/users', [AdminController::class, 'store'])->name('users.store');
        Route::post('/users/{id}/approve', [AdminController::class, 'approve'])->name('users.approve');
        Route::post('/users/{id}/revoke', [AdminController::class, 'revoke'])->name('users.revoke');
        Route::post('/users/{id}/reset-password', [AdminController::class, 'resetPassword'])->name('users.resetPassword');
        Route::delete('/users/{id}', [AdminController::class, 'destroy'])->name('users.destroy');
    });

    // 9. Pending Print — รายการรอพิมพ์ใบ อภ.๒
    Route::get('/pending-print', [PendingPrintController::class, 'index'])->name('pending-print.index');
    Route::post('/pending-print/{businessId}/mark-printed', [PendingPrintController::class, 'markPrinted'])->name('pending-print.mark-printed');
});
