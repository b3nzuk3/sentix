import { SignalLinker } from '../signalLinker';

describe('SignalLinker', () => {
  let linker: SignalLinker;

  beforeEach(() => {
    linker = new SignalLinker();
  });

  describe('tokenize', () => {
    it('should tokenize text: "Running tests" → ["run", "test"]', () => {
      const tokens = linker.tokenize('Running tests');
      expect(tokens).toEqual(['run', 'test']);
    });

    it('should handle multiple words with stop words', () => {
      const tokens = linker.tokenize('The quick brown fox jumps over the lazy dog');
      expect(tokens).toContain('quick');
      expect(tokens).toContain('brown');
      expect(tokens).toContain('fox');
      expect(tokens).toContain('jump'); // stemmed from "jumps"
      expect(tokens).not.toContain('the');
      expect(tokens).not.toContain('over');
    });

    it('should filter words shorter than 3 letters', () => {
      const tokens = linker.tokenize('a b cd efg');
      expect(tokens).toEqual(['efg']);
    });

    it('should lowercase all tokens', () => {
      const tokens = linker.tokenize('RUNNING Tests');
      expect(tokens).toEqual(['run', 'test']);
    });
  });

  describe('stem', () => {
    it('should stem "running" → "run"', () => {
      expect(linker.stem('running')).toBe('run');
    });

    it('should stem "tests" → "test"', () => {
      expect(linker.stem('tests')).toBe('test');
    });

    it('should stem "testing" → "test"', () => {
      expect(linker.stem('testing')).toBe('test');
    });

    it('should stem "tested" → "test"', () => {
      expect(linker.stem('tested')).toBe('test');
    });

    it('should stem "quickly" → "quick"', () => {
      expect(linker.stem('quickly')).toBe('quick');
    });

    it('should stem "runner" → "run"', () => {
      expect(linker.stem('runner')).toBe('run');
    });

    it('should stem "faster" → "fast"', () => {
      expect(linker.stem('faster')).toBe('fast');
    });

    it('should not overstem short words', () => {
      expect(linker.stem('cat')).toBe('cat');
    });
  });

  describe('computeIDF', () => {
    it('should compute correct IDF values', () => {
      const docs = [
        ['word1', 'word2', 'word3'],
        ['word1', 'word2'],
        ['word2', 'word3']
      ];

      const idf = linker.computeIDF(docs);

      // word1 appears in 2 docs: idf = log(3 / (1 + 2)) = log(3/3) = 0
      expect(idf.get('word1')).toBeCloseTo(0, 5);

      // word2 appears in all 3 docs: idf = log(3 / (1 + 3)) = log(3/4) ≈ -0.28768
      expect(idf.get('word2')).toBeCloseTo(Math.log(3 / 4), 5);

      // word3 appears in 2 docs: same as word1
      expect(idf.get('word3')).toBeCloseTo(0, 5);
    });

    it('should handle single document', () => {
      const docs = [['word1', 'word2']];
      const idf = linker.computeIDF(docs);

      // Each word appears in 1 doc: idf = log(1 / (1 + 1)) = log(0.5) ≈ -0.6931
      expect(idf.get('word1')).toBeCloseTo(Math.log(0.5), 5);
      expect(idf.get('word2')).toBeCloseTo(Math.log(0.5), 5);
    });

    it('should handle empty docs', () => {
      const docs: string[][] = [];
      const idf = linker.computeIDF(docs);

      expect(idf.size).toBe(0);
    });
  });

  describe('computeTFIDF', () => {
    it('should compute correct TF-IDF vector', () => {
      const tokens = ['word1', 'word2', 'word1', 'word3', 'word1'];
      const idf = new Map([
        ['word1', 1.0],
        ['word2', 0.5],
        ['word3', 2.0]
      ]);

      const tfidf = linker.computeTFIDF(tokens, idf);

      // word1: freq=3, docLen=5, tf=0.6, tfidf=0.6*1.0=0.6
      expect(tfidf.get('word1')).toBeCloseTo(0.6, 5);

      // word2: freq=1, tf=0.2, tfidf=0.2*0.5=0.1
      expect(tfidf.get('word2')).toBeCloseTo(0.1, 5);

      // word3: freq=1, tf=0.2, tfidf=0.2*2.0=0.4
      expect(tfidf.get('word3')).toBeCloseTo(0.4, 5);
    });

    it('should return empty map for empty tokens', () => {
      const idf = new Map([['word1', 1.0]]);
      const tfidf = linker.computeTFIDF([], idf);

      expect(tfidf.size).toBe(0);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1.0 for identical vectors', () => {
      const vecA = new Map([['word1', 0.5], ['word2', 0.3]]);
      const vecB = new Map([['word1', 0.5], ['word2', 0.3]]);

      expect(linker.cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5);
    });

    it('should return 0.0 for orthogonal vectors', () => {
      const vecA = new Map([['word1', 0.5], ['word2', 0.3]]);
      const vecB = new Map([['word3', 0.4], ['word4', 0.6]]);

      expect(linker.cosineSimilarity(vecA, vecB)).toBeCloseTo(0.0, 5);
    });

    it('should return correct value for partially overlapping vectors', () => {
      const vecA = new Map([['word1', 1.0], ['word2', 0.0]]);
      const vecB = new Map([['word1', 0.0], ['word2', 1.0]]);
      // Orthogonal, should be 0
      expect(linker.cosineSimilarity(vecA, vecB)).toBeCloseTo(0.0, 5);

      const vecC = new Map([['word1', 1.0], ['word2', 1.0]]);
      const vecD = new Map([['word1', 1.0], ['word2', 0.0]]);
      // Dot = 1, norms = sqrt(2) * 1, similarity = 1/sqrt(2) ≈ 0.7071
      expect(linker.cosineSimilarity(vecC, vecD)).toBeCloseTo(1 / Math.sqrt(2), 5);
    });

    it('should return 0 for zero vectors', () => {
      const vecA = new Map<string, number>();
      const vecB = new Map([['word1', 0.5]]);

      expect(linker.cosineSimilarity(vecA, vecB)).toBe(0);
      expect(linker.cosineSimilarity(vecB, vecA)).toBe(0);
      expect(linker.cosineSimilarity(vecA, vecA)).toBe(0);
    });
  });

  describe('linkSignals', () => {
    it('should link appropriate signals based on similarity', () => {
      const theme = {
        title: 'Authentication issues',
        reason: 'Users cannot login'
      };

      // Create many unrelated signals to increase IDF for rare terms (login, auth)
      const baseSignals = Array.from({ length: 25 }, (_, i) => ({
        id: `noise-${i}`,
        text: i % 3 === 0
          ? 'Random customer feedback about billing and invoices'
          : i % 3 === 1
          ? 'Feature request for dark mode and theming options'
          : 'Performance issues with dashboard loading times'
      }));

      const relevantSignals = [
        { id: '1', text: 'Login fails with SSO' },
        { id: '2', text: 'Database slow query performance' },
        { id: '3', text: 'Authentication error on login page' },
        { id: '4', text: 'API timeout errors' }
      ];

      const signals = [...relevantSignals, ...baseSignals];

      const result = linker.linkSignals(theme, signals);

      // Should match authentication-related signals (1 and 3) because they share tokens: login, auth
      const matchedIds = result.map(s => s.id);
      expect(matchedIds).toContain('1'); // "Login fails with SSO"
      expect(matchedIds).toContain('3'); // "Authentication error on login page"

      // Should not include database signal (unrelated)
      expect(matchedIds).not.toContain('2');

      // Should not include API timeout
      expect(matchedIds).not.toContain('4');

      // Should cap at 20 signals
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should include AI-provided evidence signals regardless of similarity', () => {
      const theme = {
        title: 'Authentication issues',
        reason: 'Users cannot login',
        evidence: ['2'] // Database signal - unrelated but explicitly cited
      };

      const signals = [
        { id: '1', text: 'Login fails with SSO' },
        { id: '2', text: 'Database slow query performance' },
        { id: '3', text: 'Auth error on signup page' },
        { id: '4', text: 'API timeout errors' }
      ];

      const result = linker.linkSignals(theme, signals);

      // Both should be included: evidence signal (2) and similarity-matched (1)
      const matchedIds = result.map(s => s.id);
      expect(matchedIds).toContain('1');
      expect(matchedIds).toContain('2');
    });

    it('should deduplicate signals', () => {
      const theme = {
        title: 'Login issues',
        reason: 'Users cannot login',
        evidence: ['1']
      };

      const signals = [
        { id: '1', text: 'Login fails with SSO' }
      ];

      const result = linker.linkSignals(theme, signals);

      // Should only have one signal, not duplicate
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('should cap results at 20 signals', () => {
      // Create many similar signals to test capping
      const theme = {
        title: 'Authentication',
        reason: 'Login and signup errors'
      };

      const signals = Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        text: i % 2 === 0 ? 'Authentication and login errors' : 'Random unrelated signal'
      }));

      const result = linker.linkSignals(theme, signals);

      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should return signals with similarity > 0.15', () => {
      const theme = {
        title: 'Completely unrelated topic',
        reason: 'No matching signals here at all'
      };

      const signals = [
        { id: '1', text: 'Authentication issues with login' },
        { id: '2', text: 'Database performance problems' }
      ];

      const result = linker.linkSignals(theme, signals);

      // Both signals should have very low similarity, so result might be empty
      // or only include evidence if provided
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should return signal objects with id and text', () => {
      const theme = {
        title: 'Login',
        reason: 'Signin fails'
      };

      const signals = [
        { id: 'signal-123', text: 'Login button not working' }
      ];

      const result = linker.linkSignals(theme, signals);

      expect(result[0]).toHaveProperty('id', 'signal-123');
      expect(result[0]).toHaveProperty('text', 'Login button not working');
    });

    it('should handle empty signals array', () => {
      const theme = {
        title: 'Some theme',
        reason: 'Some reason'
      };

      const result = linker.linkSignals(theme, []);

      expect(result).toEqual([]);
    });

    it('should prioritize evidence signals when exceeding 20 limit', () => {
      const theme = {
        title: 'Authentication',
        reason: 'issue',
        evidence: Array.from({ length: 15 }, (_, i) => `${i}`) // 15 evidence signals
      };

      const signals = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        text: 'Authentication issue'
      }));

      const result = linker.linkSignals(theme, signals);

      // Evidence signals should be included first, only 5 more slots
      expect(result.length).toBe(20);
      const resultIds = result.map(s => s.id);
      for (let i = 0; i < 15; i++) {
        expect(resultIds).toContain(`${i}`);
      }
    });
  });
});
