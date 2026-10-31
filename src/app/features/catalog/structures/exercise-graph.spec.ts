import { beforeEach, describe, expect, it } from 'vitest';
import { ExerciseGraph } from './exercise-graph';
import {
  createExerciseGraph,
  EXERCISE_CONNECTIONS,
} from '../data/exercise-connections.data';
import { EXERCISES } from '../data/exercises.data';

describe('ExerciseGraph', () => {
  let graph: ExerciseGraph;

  beforeEach(() => {
    graph = new ExerciseGraph();
  });

  it('comienza sin nodos ni conexiones', () => {
    expect(graph.getVertices()).toEqual([]);
    expect(graph.getVertexCount()).toBe(0);
    expect(graph.getEdgeCount()).toBe(0);
  });

  it('agrega un nodo al grafo', () => {
    graph.addVertex('exercise-a');

    expect(graph.hasVertex('exercise-a')).toBe(true);
    expect(graph.getVertices()).toEqual(['exercise-a']);
    expect(graph.getVertexCount()).toBe(1);
  });

  it('no duplica un nodo existente', () => {
    graph.addVertex('exercise-a');
    graph.addVertex('exercise-a');

    expect(graph.getVertexCount()).toBe(1);
  });

  it('rechaza identificadores vacíos', () => {
    expect(() => graph.addVertex('')).toThrowError(
      'El identificador del ejercicio no puede estar vacío.',
    );

    expect(() => graph.addVertex('   ')).toThrowError(
      'El identificador del ejercicio no puede estar vacío.',
    );

    expect(graph.getVertexCount()).toBe(0);
  });

  it('indica cuando un nodo no existe', () => {
    expect(graph.hasVertex('unknown')).toBe(false);
  });

  it('conecta dos nodos en ambos sentidos', () => {
    graph.addVertex('exercise-a');
    graph.addVertex('exercise-b');

    graph.addEdge('exercise-a', 'exercise-b');

    expect(graph.getNeighbors('exercise-a')).toEqual([
      'exercise-b',
    ]);

    expect(graph.getNeighbors('exercise-b')).toEqual([
      'exercise-a',
    ]);

    expect(graph.getEdgeCount()).toBe(1);
  });

  it('no duplica conexiones repetidas o invertidas', () => {
    graph.addVertex('exercise-a');
    graph.addVertex('exercise-b');

    graph.addEdge('exercise-a', 'exercise-b');
    graph.addEdge('exercise-a', 'exercise-b');
    graph.addEdge('exercise-b', 'exercise-a');

    expect(graph.getNeighbors('exercise-a')).toEqual([
      'exercise-b',
    ]);

    expect(graph.getNeighbors('exercise-b')).toEqual([
      'exercise-a',
    ]);

    expect(graph.getEdgeCount()).toBe(1);
  });

  it('rechaza una conexión si el primer nodo no existe', () => {
    graph.addVertex('exercise-b');

    expect(() =>
      graph.addEdge('unknown', 'exercise-b'),
    ).toThrowError(
      'Ambos ejercicios deben existir antes de conectarlos.',
    );

    expect(graph.getNeighbors('exercise-b')).toEqual([]);
    expect(graph.getEdgeCount()).toBe(0);
  });

  it('rechaza una conexión si el segundo nodo no existe', () => {
    graph.addVertex('exercise-a');

    expect(() =>
      graph.addEdge('exercise-a', 'unknown'),
    ).toThrowError(
      'Ambos ejercicios deben existir antes de conectarlos.',
    );

    expect(graph.getNeighbors('exercise-a')).toEqual([]);
    expect(graph.getEdgeCount()).toBe(0);
  });

  it('rechaza conectar un nodo consigo mismo', () => {
    graph.addVertex('exercise-a');

    expect(() =>
      graph.addEdge('exercise-a', 'exercise-a'),
    ).toThrowError(
      'Un ejercicio no puede conectarse consigo mismo.',
    );

    expect(graph.getNeighbors('exercise-a')).toEqual([]);
    expect(graph.getEdgeCount()).toBe(0);
  });

  it('devuelve una lista vacía para un nodo sin conexiones', () => {
    graph.addVertex('exercise-a');

    expect(graph.getNeighbors('exercise-a')).toEqual([]);
  });

  it('devuelve una lista vacía para un nodo inexistente', () => {
    expect(graph.getNeighbors('unknown')).toEqual([]);
  });

  it('conserva las conexiones al volver a agregar un nodo', () => {
    graph.addVertex('exercise-a');
    graph.addVertex('exercise-b');
    graph.addEdge('exercise-a', 'exercise-b');

    graph.addVertex('exercise-a');

    expect(graph.getNeighbors('exercise-a')).toEqual([
      'exercise-b',
    ]);

    expect(graph.getEdgeCount()).toBe(1);
  });

  it('devuelve solo vecinos directos, no conexiones indirectas', () => {
    graph.addVertex('exercise-a');
    graph.addVertex('exercise-b');
    graph.addVertex('exercise-c');

    graph.addEdge('exercise-a', 'exercise-b');
    graph.addEdge('exercise-b', 'exercise-c');

    expect(graph.getNeighbors('exercise-a')).toEqual([
      'exercise-b',
    ]);

    expect(graph.getNeighbors('exercise-a')).not.toContain(
      'exercise-c',
    );

    expect(graph.getEdgeCount()).toBe(2);
  });

  it('no expone la colección interna de vecinos', () => {
    graph.addVertex('exercise-a');
    graph.addVertex('exercise-b');
    graph.addEdge('exercise-a', 'exercise-b');

    const neighbors = graph.getNeighbors('exercise-a');
    neighbors.push('injected-id');

    expect(graph.getNeighbors('exercise-a')).toEqual([
      'exercise-b',
    ]);
  });

  it('no expone la colección interna de nodos', () => {
    graph.addVertex('exercise-a');

    const vertices = graph.getVertices();
    vertices.push('injected-id');

    expect(graph.hasVertex('injected-id')).toBe(false);
    expect(graph.getVertexCount()).toBe(1);
  });
});

describe('createExerciseGraph', () => {
  it('crea un nodo para cada ejercicio del catálogo', () => {
    const graph = createExerciseGraph();

    expect(graph.getVertexCount()).toBe(EXERCISES.length);

    for (const exercise of EXERCISES) {
      expect(graph.hasVertex(exercise.id)).toBe(true);
    }
  });

  it('incorpora las conexiones de demostración en ambos sentidos', () => {
    const graph = createExerciseGraph();

    for (const connection of EXERCISE_CONNECTIONS) {
      expect(
        graph.getNeighbors(connection.firstId),
      ).toContain(connection.secondId);

      expect(
        graph.getNeighbors(connection.secondId),
      ).toContain(connection.firstId);
    }

    expect(graph.getEdgeCount()).toBe(
      EXERCISE_CONNECTIONS.length,
    );
  });

  it('conserva ejercicios sin conexiones', () => {
    const graph = createExerciseGraph();

    expect(graph.getNeighbors('push-up')).toEqual([]);
    expect(graph.getNeighbors('dumbbell-curl')).toEqual([]);
  });

  it('crea instancias independientes', () => {
    const firstGraph = createExerciseGraph();
    const secondGraph = createExerciseGraph();

    firstGraph.addVertex('temporary-exercise');

    expect(
      secondGraph.hasVertex('temporary-exercise'),
    ).toBe(false);
  });
});