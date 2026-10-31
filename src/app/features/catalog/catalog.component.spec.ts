import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogComponent } from './catalog.component';

describe('CatalogComponent', () => {
  let fixture: ComponentFixture<CatalogComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogComponent);
    element = fixture.nativeElement as HTMLElement;

    await render();
  });

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function getElement<T extends HTMLElement>(
    selector: string,
  ): T {
    const result = element.querySelector<T>(selector);

    if (!result) {
      throw new Error(
        `No se encontró el elemento: ${selector}`,
      );
    }

    return result;
  }

  function getCards(): HTMLElement[] {
    return Array.from(
      element.querySelectorAll<HTMLElement>('.exercise-card'),
    );
  }

  function getAlternativeCards(): HTMLElement[] {
    return Array.from(
      element.querySelectorAll<HTMLElement>('.alternative-card'),
    );
  }

  async function search(value: string): Promise<void> {
    const input = getElement<HTMLInputElement>(
      '#exercise-search',
    );

    input.value = value;
    input.dispatchEvent(
      new Event('input', { bubbles: true }),
    );

    await render();
  }

  async function selectOption(
    selector: string,
    value: string,
  ): Promise<void> {
    const select = getElement<HTMLSelectElement>(selector);

    select.value = value;
    select.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    await render();
  }

  async function click(selector: string): Promise<void> {
    getElement<HTMLButtonElement>(selector).click();
    await render();
  }

  async function openAlternatives(
    exerciseId: string,
  ): Promise<void> {
    await click(
      `.exercise-card[aria-labelledby="exercise-${exerciseId}"] ` +
      '.alternatives-button',
    );
  }

  it('muestra los seis ejercicios iniciales', () => {
    expect(getCards()).toHaveLength(6);

    expect(
      getElement<HTMLButtonElement>(
        '.filters__header .reset-button',
      ).disabled,
    ).toBe(true);
  });

  it('busca por prefijo y muestra una sugerencia', async () => {
    await search('re');

    const cards = getCards();

    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain(
      'Remo con mancuerna',
    );

    const suggestions = element.querySelectorAll(
      '.search-suggestions__option',
    );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].textContent).toContain(
      'Remo con mancuerna',
    );
  });

  it('permite buscar con mayúsculas y sin tildes', async () => {
    await search('JALON');

    const cards = getCards();

    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain(
      'Jalón al pecho',
    );
  });

  it('completa el nombre al seleccionar una sugerencia', async () => {
    await search('re');
    await click('.search-suggestions__option');

    const input = getElement<HTMLInputElement>(
      '#exercise-search',
    );

    expect(input.value).toBe('Remo con mancuerna');
    expect(
      element.querySelector('.search-suggestions'),
    ).toBeNull();

    expect(getCards()).toHaveLength(1);
  });

  it('oculta las sugerencias al pulsar Escape', async () => {
    await search('re');

    const input = getElement<HTMLInputElement>(
      '#exercise-search',
    );

    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      }),
    );

    await render();

    expect(
      element.querySelector('.search-suggestions'),
    ).toBeNull();

    expect(input.value).toBe('re');
    expect(getCards()).toHaveLength(1);
  });

  it('combina los filtros de equipo y grupo muscular', async () => {
    await selectOption('#equipment-filter', 'machine');
    await selectOption('#muscle-filter', 'back');

    const cards = getCards();

    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain(
      'Jalón al pecho',
    );
  });

  it('muestra el estado vacío para una búsqueda sin coincidencias', async () => {
    await search('xyz');

    expect(getCards()).toHaveLength(0);

    expect(
      getElement<HTMLElement>(
        '.results .empty-state',
      ).textContent,
    ).toContain(
      'No encontramos ejercicios con esa búsqueda y esos filtros.',
    );
  });

  it('limpia el buscador y los filtros del catálogo', async () => {
    await search('remo');
    await selectOption('#equipment-filter', 'dumbbells');
    await selectOption('#muscle-filter', 'back');
    await selectOption('#level-filter', 'beginner');

    await click('.filters__header .reset-button');

    expect(
      getElement<HTMLInputElement>(
        '#exercise-search',
      ).value,
    ).toBe('');

    expect(
      getElement<HTMLSelectElement>(
        '#equipment-filter',
      ).value,
    ).toBe('all');

    expect(
      getElement<HTMLSelectElement>(
        '#muscle-filter',
      ).value,
    ).toBe('all');

    expect(
      getElement<HTMLSelectElement>(
        '#level-filter',
      ).value,
    ).toBe('all');

    expect(getCards()).toHaveLength(6);

    expect(
      element.querySelector('.search-suggestions'),
    ).toBeNull();

    expect(
      getElement<HTMLButtonElement>(
        '.filters__header .reset-button',
      ).disabled,
    ).toBe(true);
  });

  it('abre las conexiones directas de un ejercicio', async () => {
    await openAlternatives('dumbbell-row');

    expect(
      getElement<HTMLElement>(
        '#alternatives-title',
      ).textContent,
    ).toContain('Remo con mancuerna');

    const alternatives = getAlternativeCards();

    expect(alternatives).toHaveLength(1);
    expect(alternatives[0].textContent).toContain(
      'Jalón al pecho',
    );

    expect(
      getElement<HTMLButtonElement>(
        '.exercise-card--selected .alternatives-button',
      ).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('muestra el estado sin conexiones para Flexiones', async () => {
    await openAlternatives('push-up');

    expect(getAlternativeCards()).toHaveLength(0);

    expect(
      getElement<HTMLElement>(
        '#alternatives-panel',
      ).textContent,
    ).toContain(
      'Este ejercicio todavía no tiene conexiones.',
    );
  });

  it('filtra las alternativas por equipamiento', async () => {
    await openAlternatives('dumbbell-row');

    await selectOption(
      '#alternative-equipment',
      'dumbbells',
    );

    expect(getAlternativeCards()).toHaveLength(0);

    expect(
      getElement<HTMLElement>(
        '#alternatives-panel .empty-state',
      ).textContent,
    ).toContain(
      'Ninguna conexión coincide con estos filtros.',
    );

    await selectOption(
      '#alternative-equipment',
      'machine',
    );

    expect(getAlternativeCards()).toHaveLength(1);
  });

  it('filtra las alternativas por nivel', async () => {
    await openAlternatives('dumbbell-row');

    await selectOption(
      '#alternative-level',
      'intermediate',
    );

    expect(getAlternativeCards()).toHaveLength(0);

    await selectOption(
      '#alternative-level',
      'beginner',
    );

    expect(getAlternativeCards()).toHaveLength(1);
  });

  it('limpia los filtros de alternativas sin cambiar el catálogo', async () => {
    await search('remo');
    await selectOption('#equipment-filter', 'dumbbells');

    await openAlternatives('dumbbell-row');

    await selectOption(
      '#alternative-equipment',
      'bodyweight',
    );

    await selectOption(
      '#alternative-level',
      'intermediate',
    );

    await click(
      '.alternatives-summary .reset-button',
    );

    expect(
      getElement<HTMLSelectElement>(
        '#alternative-equipment',
      ).value,
    ).toBe('all');

    expect(
      getElement<HTMLSelectElement>(
        '#alternative-level',
      ).value,
    ).toBe('all');

    expect(getAlternativeCards()).toHaveLength(1);

    expect(
      getElement<HTMLInputElement>(
        '#exercise-search',
      ).value,
    ).toBe('remo');

    expect(
      getElement<HTMLSelectElement>(
        '#equipment-filter',
      ).value,
    ).toBe('dumbbells');
  });

  it('oculta el panel al pulsar de nuevo su botón', async () => {
    await openAlternatives('dumbbell-row');
    await openAlternatives('dumbbell-row');

    expect(
      element.querySelector('#alternatives-panel'),
    ).toBeNull();
  });

  it('cierra el panel al cambiar la búsqueda principal', async () => {
    await openAlternatives('dumbbell-row');
    await search('sent');

    expect(
      element.querySelector('#alternatives-panel'),
    ).toBeNull();

    expect(getCards()).toHaveLength(1);
    expect(getCards()[0].textContent).toContain(
      'Sentadilla sin carga',
    );
  });

  it('cierra el panel al cambiar un filtro principal', async () => {
    await openAlternatives('dumbbell-row');
    await selectOption('#equipment-filter', 'machine');

    expect(
      element.querySelector('#alternatives-panel'),
    ).toBeNull();

    expect(getCards()).toHaveLength(2);
  });
});