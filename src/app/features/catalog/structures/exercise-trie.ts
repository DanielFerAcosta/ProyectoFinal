class TrieNode {
  readonly children = new Map<string, TrieNode>();
  readonly exerciseIds = new Set<string>();
}

export class ExerciseTrie {
  private readonly root = new TrieNode();

  insert(name: string, exerciseId: string): void {
    const normalizedName = this.normalize(name);

    if (!normalizedName) {
      return;
    }

    let current = this.root;

    for (const character of normalizedName) {
      let next = current.children.get(character);

      if (!next) {
        next = new TrieNode();
        current.children.set(character, next);
      }

      current = next;
    }

    current.exerciseIds.add(exerciseId);
  }

  searchByPrefix(prefix: string): string[] {
    const normalizedPrefix = this.normalize(prefix);
    let current = this.root;

    for (const character of normalizedPrefix) {
      const next = current.children.get(character);

      if (!next) {
        return [];
      }

      current = next;
    }

    const results: string[] = [];
    this.collectIds(current, results);

    return results;
  }

  private collectIds(node: TrieNode, results: string[]): void {
    results.push(...node.exerciseIds);

    for (const child of node.children.values()) {
      this.collectIds(child, results);
    }
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }
}