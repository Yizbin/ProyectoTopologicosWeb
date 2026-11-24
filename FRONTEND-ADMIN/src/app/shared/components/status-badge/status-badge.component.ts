import { Component, computed, input } from '@angular/core';

interface BadgeStyle {
  label: string;
  classes: string;
}

const BADGE_STYLES: Record<string, BadgeStyle> = {
  pendiente: {
    label: 'Pendiente',
    classes: 'bg-amber-100 text-amber-900 ring-amber-200',
  },
  confirmada: {
    label: 'Confirmada',
    classes: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  },
  completada: {
    label: 'Completada',
    classes: 'bg-sky-100 text-sky-900 ring-sky-200',
  },
  cancelada: {
    label: 'Cancelada',
    classes: 'bg-stone-200 text-stone-700 ring-stone-300',
  },
  PENDIENTE: {
    label: 'Pendiente',
    classes: 'bg-amber-100 text-amber-900 ring-amber-200',
  },
  COMPLETADO: {
    label: 'Completado',
    classes: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  },
  REEMBOLSADO: {
    label: 'Reembolsado',
    classes: 'bg-stone-200 text-stone-700 ring-stone-300',
  },
  ADMIN: {
    label: 'ADMIN',
    classes: 'bg-[#e4e9e0] text-[#23312b] ring-[#526e5c]/30',
  },
  CLIENTE: {
    label: 'CLIENTE',
    classes: 'bg-stone-100 text-stone-700 ring-stone-300',
  },
  activo: {
    label: 'Activo',
    classes: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  },
  inactivo: {
    label: 'Inactivo',
    classes: 'bg-stone-200 text-stone-700 ring-stone-300',
  },
  true: {
    label: 'Activo',
    classes: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  },
  false: {
    label: 'Inactivo',
    classes: 'bg-stone-200 text-stone-700 ring-stone-300',
  },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset"
      [class]="resolved().classes"
    >
      {{ resolved().label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly value = input.required<string | boolean>();
  readonly label = input<string | null>(null);

  readonly resolved = computed<BadgeStyle>(() => {
    const rawKey = String(this.value());
    const preset = BADGE_STYLES[rawKey] ?? {
      label: rawKey,
      classes: 'bg-stone-100 text-stone-800 ring-stone-200',
    };

    const customLabel = this.label();
    return {
      label: customLabel ?? preset.label,
      classes: preset.classes,
    };
  });
}
