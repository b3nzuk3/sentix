/**
 * SignalLinker: associates signals with themes based on semantic similarity
 * Uses TF-IDF vectorization and cosine similarity
 */
export class SignalLinker {
  private stopWords: Set<string>;
  private stemCache: Map<string, string> = new Map();

  constructor() {
    this.stopWords = new Set([
      'the', 'is', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'it', 'its', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'over', 'page'
    ]);
  }

  linkSignals(
    theme: { title: string; reason: string; evidence?: string[] },
    signals: Array<{ id: string; text: string }>
  ): Array<{ id: string; text: string }> {
    // Step 1: Start with AI-provided evidence signals
    const evidenceSignalIds = new Set(theme.evidence || []);
    const linkedSignals = new Map<string, { id: string; text: string }>();

    // Add evidence signals first
    for (const signal of signals) {
      if (evidenceSignalIds.has(signal.id)) {
        linkedSignals.set(signal.id, signal);
      }
    }

    // If no signals or all are already evidence, return early
    if (signals.length === 0) {
      return Array.from(linkedSignals.values()).slice(0, 20);
    }

    // Step 2: Tokenize all signal texts to build corpus
    const signalTokens = signals.map(signal => this.tokenize(signal.text));

    // Step 3: Compute IDF across all signals
    const idf = this.computeIDF(signalTokens);

    // Step 4: Build theme vector from title + reason
    const themeTokens = this.tokenize(theme.title + ' ' + theme.reason);
    const themeVector = this.computeTFIDF(themeTokens, idf);

    // Step 5: Compute cosine similarity for each signal
    const similarityScores: Array<{ id: string; text: string; score: number }> = [];

    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      const tokens = signalTokens[i];
      const signalVector = this.computeTFIDF(tokens, idf);

      const similarity = this.cosineSimilarity(themeVector, signalVector);

      // Only consider signals above threshold and not already included
      if (similarity > 0.15 && !linkedSignals.has(signal.id)) {
        similarityScores.push({ id: signal.id, text: signal.text, score: similarity });
      }
    }

    // Step 6: Sort by similarity and select top signals (up to 20 total)
    similarityScores.sort((a, b) => b.score - a.score);
    const remainingSlots = 20 - linkedSignals.size;
    const topSignals = similarityScores.slice(0, remainingSlots);

    for (const signal of topSignals) {
      linkedSignals.set(signal.id, { id: signal.id, text: signal.text });
    }

    // Return as array (max 20)
    return Array.from(linkedSignals.values()).slice(0, 20);
  }

  public tokenize(text: string): string[] {
    // Convert to lowercase and extract words (3+ letters)
    const words = text.toLowerCase().match(/[a-z]{3,}/g) || [];

    // Filter stop words and stem
    return words
      .filter(word => !this.stopWords.has(word))
      .map(word => this.stem(word));
  }

  public stem(word: string): string {
    // Check cache first
    if (this.stemCache.has(word)) {
      return this.stemCache.get(word)!;
    }

    let stemmed = word;

    // Common suffixes to remove (in order of decreasing length)
    const suffixes = [
      'ization', 'isation',
      'ational', 'ation', 'icator', 'ication',
      'fulness',
      'ousness', 'osity',
      'iveness', 'ivity',
      'alistic',
      'ically',
      'icator', 'ication',
      'ement', 'ance', 'ence',
      'ability', 'ibility',
      'antly', 'ently',
      'ator', 'or', 'er',
      'alism', 'ism',
      'ness',
      'ment',
      'ent', 'ant',
      'ship',
      'ing',
      'ed',
      'ly',
      'es', 's',
    ];

    let changed = true;
    while (changed) {
      changed = false;
      for (const suffix of suffixes) {
        if (stemmed.length > suffix.length + 2 && stemmed.endsWith(suffix)) {
          stemmed = stemmed.slice(0, -suffix.length);

          if (stemmed.length > 1 && stemmed[stemmed.length - 1] === stemmed[stemmed.length - 2]) {
            stemmed = stemmed.slice(0, -1);
          }

          changed = true;
          break;
        }
      }
    }

    this.stemCache.set(word, stemmed);
    return stemmed;
  }

  public computeIDF(docs: string[][]): Map<string, number> {
    const idf = new Map<string, number>();
    const N = docs.length;
    const docFrequency = new Map<string, number>();

    for (const doc of docs) {
      const uniqueTerms = new Set(doc);
      for (const term of uniqueTerms) {
        docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
      }
    }

    for (const [term, df] of docFrequency.entries()) {
      idf.set(term, Math.log(N / (1 + df)));
    }

    return idf;
  }

  public computeTFIDF(tokens: string[], idf: Map<string, number>): Map<string, number> {
    const tfidf = new Map<string, number>();
    const docLength = tokens.length;

    if (docLength === 0) {
      return tfidf;
    }

    const termFreq = new Map<string, number>();
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    }

    for (const [term, freq] of termFreq.entries()) {
      const tf = freq / docLength;
      const idfVal = idf.get(term) || 0;
      tfidf.set(term, tf * idfVal);
    }

    return tfidf;
  }

  public cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const [term, valA] of vecA.entries()) {
      normA += valA * valA;
      const valB = vecB.get(term) || 0;
      dotProduct += valA * valB;
    }

    for (const valB of vecB.values()) {
      normB += valB * valB;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }
}
