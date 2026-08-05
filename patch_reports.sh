sed -i 's/<tbody class="divide-y divide-slate-100 md:divide-none text-sm block md:table-row-group">/<tbody class="flex flex-col md:table-row-group gap-3 md:gap-0 divide-y-0 md:divide-y divide-transparent md:divide-slate-100 text-sm bg-slate-50 md:bg-transparent p-3 md:p-0">/g' src/app/reports.component.ts

sed -i 's/<tr class="hover:bg-slate-50 transition-colors block md:table-row py-4 md:py-0 border-b border-slate-100 md:border-none">/<tr class="hover:bg-slate-50 md:hover:bg-slate-50 transition-colors flex flex-col md:table-row py-4 md:py-0 border border-slate-200 md:border-none md:border-b md:border-slate-100 relative bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none">/g' src/app/reports.component.ts

sed -i 's/<td class="px-4 md:px-6 py-2 md:py-4 text-left md:text-right text-slate-600 whitespace-nowrap block md:table-cell">/<td class="px-4 md:px-6 py-2 md:py-4 text-left md:text-right text-slate-600 whitespace-nowrap block md:table-cell"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Monto Facturado (Ventas)<\/div>/g' src/app/reports.component.ts

sed -i 's/<td class="px-4 md:px-6 py-2 md:py-4 text-left md:text-right font-bold text-emerald-600 whitespace-nowrap block md:table-cell">/<td class="px-4 md:px-6 py-2 md:py-4 text-left md:text-right font-bold text-emerald-600 whitespace-nowrap block md:table-cell"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Cobranza Efectiva (Pagos)<\/div>/g' src/app/reports.component.ts

