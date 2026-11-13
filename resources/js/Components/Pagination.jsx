import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null;

    return (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-xl">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-700">
                        แสดงข้อมูลตามหน้า
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-lg shadow-xs" aria-label="Pagination">
                        {links.map((link, idx) => {
                            const isPrev = link.label.includes('Previous') || link.label.includes('&laquo;');
                            const isNext = link.label.includes('Next') || link.label.includes('&raquo;');
                            const cleanLabel = isPrev ? <ChevronLeft className="w-4 h-4" /> : isNext ? <ChevronRight className="w-4 h-4" /> : link.label;

                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-slate-300 ring-1 ring-inset ring-slate-200 cursor-not-allowed bg-slate-50"
                                    >
                                        {cleanLabel}
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    className={`relative inline-flex items-center px-3.5 py-2 text-sm font-semibold transition-colors ${
                                        link.active
                                            ? 'z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                                            : 'text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 focus:outline-offset-0'
                                    } ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === links.length - 1 ? 'rounded-r-lg' : ''}`}
                                >
                                    {cleanLabel}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}

