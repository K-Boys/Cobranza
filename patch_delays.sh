sed -i 's/<tbody class="divide-y divide-slate-100 md:divide-none block md:table-row-group">/<tbody class="flex flex-col md:table-row-group gap-3 md:gap-0 divide-y-0 md:divide-y divide-transparent md:divide-slate-100 bg-slate-50 md:bg-transparent p-3 md:p-0">/g' src/app/delays.component.ts

sed -i 's/<tr class="hover:bg-slate-50 transition-colors block md:table-row py-4 md:py-0 border-b border-slate-100 md:border-none">/<tr class="hover:bg-slate-50 transition-colors flex flex-col md:table-row py-4 md:py-0 border border-slate-200 md:border-none md:border-b md:border-slate-100 relative bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none">/g' src/app/delays.component.ts

# Add mobile labels
sed -i 's/<td class="px-4 md:px-6 py-2 md:py-4 font-medium text-rose-600 block md:table-cell">/<td class="px-4 md:px-6 py-2 md:py-4 font-medium text-rose-600 block md:table-cell"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Deuda Total<\/div>/g' src/app/delays.component.ts

sed -i 's/<td class="px-4 md:px-6 py-2 md:py-4 text-slate-600 block md:table-cell">/<td class="px-4 md:px-6 py-2 md:py-4 text-slate-600 block md:table-cell"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Días de Crédito<\/div>/g' src/app/delays.component.ts

