const fs = require('fs');

let supplies = fs.readFileSync('src/app/supplies.component.ts', 'utf-8');
supplies = supplies.replace(
  '<img [src]="supplyForm.value.image" class="w-16 h-16 object-cover rounded-lg border border-slate-200">',
  '<img [src]="supplyForm.value.image" class="w-16 h-16 object-cover rounded-lg border border-slate-200" alt="Imagen">'
);
supplies = supplies.replace(
  '<div class="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" (click)="previewImage.set(sup.image)">',
  '<button type="button" class="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" (click)="previewImage.set(sup.image)">'
);
// replace closing div for the above button. The div is on the line above `<img [src]="sup.image" [alt]="sup.name" class="w-full h-full object-cover">` 
// wait, the closing tag is after the img:
supplies = supplies.replace(
  '<img [src]="sup.image" [alt]="sup.name" class="w-full h-full object-cover">\n                </div>',
  '<img [src]="sup.image" [alt]="sup.name" class="w-full h-full object-cover">\n                </button>'
);

supplies = supplies.replace(
  '<div class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" (click)="previewImage.set(null)">',
  '<div class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" (click)="previewImage.set(null)" (keyup.enter)="previewImage.set(null)" tabindex="0">'
);
supplies = supplies.replace(
  '<div class="relative max-w-4xl max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-200" (click)="$event.stopPropagation()">',
  '<div class="relative max-w-4xl max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-200" (click)="$event.stopPropagation()" (keyup.enter)="$event.stopPropagation()" tabindex="0">'
);
supplies = supplies.replace(
  '<img [src]="previewImage()" class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-white">',
  '<img [src]="previewImage()" class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-white" alt="Preview">'
);
fs.writeFileSync('src/app/supplies.component.ts', supplies);
