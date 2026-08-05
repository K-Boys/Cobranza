sed -i 's/<tr class="hover:bg-slate-50 transition-colors group cursor-pointer block md:table-row py-4 md:py-0 border-b border-slate-100 md:border-none" (click)="viewClient(client.id)">/<tr class="hover:bg-slate-50 transition-colors group cursor-pointer flex flex-col md:table-row py-4 md:py-0 border-b border-slate-200 md:border-b-slate-100 relative bg-white md:bg-transparent" (click)="viewClient(client.id)">/g' src/app/clients.component.ts

sed -i 's/<td class="px-4 md:px-6 py-1 md:py-4 block md:table-cell">/<td class="px-4 md:px-6 py-2 md:py-4 block md:table-cell">/g' src/app/clients.component.ts

sed -i 's/<td class="px-4 md:px-6 py-1 md:py-4 min-w-\[200px\] block md:table-cell">/<td class="px-4 md:px-6 py-2 md:py-4 min-w-[200px] block md:table-cell">/g' src/app/clients.component.ts

# Also adjust actions to be at the top right on mobile
sed -i 's/<td class="absolute right-2 top-4 md:static px-4 md:px-6 py-2 md:py-4 text-right whitespace-nowrap flex md:table-cell justify-end">/<td class="absolute right-2 top-4 md:static px-4 md:px-6 py-2 md:py-4 text-right whitespace-nowrap flex md:table-cell justify-end items-start md:items-center">/g' src/app/clients.component.ts

