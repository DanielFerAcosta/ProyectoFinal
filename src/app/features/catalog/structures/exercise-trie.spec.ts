import { beforeEach, describe, expect, it } from 'vitest';
import { ExerciseTrie } from './exercise-trie';

describe('ExerciseTrie', () => {
  let trie: ExerciseTrie;

  beforeEach(() => {
    trie = new ExerciseTrie();
  });

  it('encuentra un ejercicio por el inicio de su nombre', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    expect(trie.searchByPrefix('re')).toEqual([
      'dumbbell-row',
    ]);
  });

  it('encuentra un ejercicio por su nombre completo', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    expect(
      trie.searchByPrefix('Remo con mancuerna'),
    ).toEqual(['dumbbell-row']);
  });

  it('devuelve varias coincidencias para un mismo prefijo', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');
    trie.insert('Remo en máquina', 'machine-row');
    trie.insert('Sentadilla sin carga', 'bodyweight-squat');

    const results = trie.searchByPrefix('remo');

    expect(results).toHaveLength(2);
    expect(results).toEqual(
      expect.arrayContaining([
        'dumbbell-row',
        'machine-row',
      ]),
    );
  });

  it('ignora las diferencias entre mayúsculas y minúsculas', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    expect(trie.searchByPrefix('REMO')).toEqual([
      'dumbbell-row',
    ]);
  });

  it('permite buscar sin escribir las tildes del nombre', () => {
    trie.insert('Jalón al pecho', 'lat-pulldown');

    expect(trie.searchByPrefix('jalon')).toEqual([
      'lat-pulldown',
    ]);
  });

  it('normaliza también las tildes del texto de búsqueda', () => {
    trie.insert('Jalón al pecho', 'lat-pulldown');

    expect(trie.searchByPrefix('JALÓN')).toEqual([
      'lat-pulldown',
    ]);
  });

  it('ignora los espacios al inicio y al final de la búsqueda', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    expect(trie.searchByPrefix('  remo  ')).toEqual([
      'dumbbell-row',
    ]);
  });

  it('normaliza los espacios consecutivos', () => {
    trie.insert('Remo   con mancuerna', 'dumbbell-row');

    expect(trie.searchByPrefix('remo  con')).toEqual([
      'dumbbell-row',
    ]);
  });

  it('devuelve un arreglo vacío si el prefijo no existe', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    expect(trie.searchByPrefix('xyz')).toEqual([]);
  });

  it('no busca palabras ubicadas en medio del nombre', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    expect(trie.searchByPrefix('mancuerna')).toEqual([]);
  });

  it('devuelve todos los ejercicios al buscar un prefijo vacío', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');
    trie.insert('Jalón al pecho', 'lat-pulldown');

    const results = trie.searchByPrefix('');

    expect(results).toHaveLength(2);
    expect(results).toEqual(
      expect.arrayContaining([
        'dumbbell-row',
        'lat-pulldown',
      ]),
    );
  });

  it('trata una búsqueda de solo espacios como una búsqueda vacía', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    expect(trie.searchByPrefix('   ')).toEqual([
      'dumbbell-row',
    ]);
  });

  it('no duplica un identificador al repetir la misma inserción', () => {
    trie.insert('Remo con mancuerna', 'dumbbell-row');
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    expect(trie.searchByPrefix('remo')).toEqual([
      'dumbbell-row',
    ]);
  });

  it('conserva distintos identificadores para un mismo nombre', () => {
    trie.insert('Remo', 'row-one');
    trie.insert('Remo', 'row-two');

    const results = trie.searchByPrefix('remo');

    expect(results).toHaveLength(2);
    expect(results).toEqual(
      expect.arrayContaining(['row-one', 'row-two']),
    );
  });

  it('conserva un nombre que también es prefijo de otro', () => {
    trie.insert('Remo', 'row');
    trie.insert('Remo con mancuerna', 'dumbbell-row');

    const results = trie.searchByPrefix('remo');

    expect(results).toHaveLength(2);
    expect(results).toEqual(
      expect.arrayContaining(['row', 'dumbbell-row']),
    );
  });

  it('ignora la inserción de nombres vacíos', () => {
    trie.insert('', 'empty-name');
    trie.insert('   ', 'blank-name');

    expect(trie.searchByPrefix('')).toEqual([]);
  });

  it('devuelve un arreglo vacío cuando el trie no tiene ejercicios', () => {
    expect(trie.searchByPrefix('remo')).toEqual([]);
    expect(trie.searchByPrefix('')).toEqual([]);
  });
});