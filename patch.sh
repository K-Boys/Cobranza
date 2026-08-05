sed -i 's/<button class="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors" (click)="viewClient(client.id); $event.stopPropagation()">/<!-- removed view button -->/g' src/app/clients.component.ts
sed -i 's/<mat-icon>arrow_forward_ios<\/mat-icon>//g' src/app/clients.component.ts
sed -i 's/<\/button>//g' src/app/clients.component.ts
