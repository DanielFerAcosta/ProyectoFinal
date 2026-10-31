export class ExerciseGraph {
  private readonly adjacencyList = new Map<string, Set<string>>();

  addVertex(exerciseId: string): void {
    if (exerciseId.trim() === '') {
      throw new Error(
        'El identificador del ejercicio no puede estar vacío.',
      );
    }

    if (!this.adjacencyList.has(exerciseId)) {
      this.adjacencyList.set(exerciseId, new Set<string>());
    }
  }

  hasVertex(exerciseId: string): boolean {
    return this.adjacencyList.has(exerciseId);
  }

  addEdge(firstId: string, secondId: string): void {
    const firstNeighbors = this.adjacencyList.get(firstId);
    const secondNeighbors = this.adjacencyList.get(secondId);

    if (!firstNeighbors || !secondNeighbors) {
      throw new Error(
        'Ambos ejercicios deben existir antes de conectarlos.',
      );
    }

    if (firstId === secondId) {
      throw new Error(
        'Un ejercicio no puede conectarse consigo mismo.',
      );
    }

    firstNeighbors.add(secondId);
    secondNeighbors.add(firstId);
  }

  getNeighbors(exerciseId: string): string[] {
    const neighbors = this.adjacencyList.get(exerciseId);

    return neighbors ? [...neighbors] : [];
  }

  getVertices(): string[] {
    return [...this.adjacencyList.keys()];
  }

  getVertexCount(): number {
    return this.adjacencyList.size;
  }

  getEdgeCount(): number {
    let totalConnections = 0;

    for (const neighbors of this.adjacencyList.values()) {
      totalConnections += neighbors.size;
    }

    return totalConnections / 2;
  }
}