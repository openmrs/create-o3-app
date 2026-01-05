import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, LogLevel } from '../logger.js';

// Mock console methods
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Logger', () => {
  beforeEach(() => {
    logger.setLevel(LogLevel.INFO);
    logger.setQuiet(false);
    vi.clearAllMocks();
  });

  describe('Log Levels', () => {
    it('should log errors at ERROR level', () => {
      logger.setLevel(LogLevel.ERROR);
      logger.error('test error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log warnings at WARN level', () => {
      logger.setLevel(LogLevel.WARN);
      logger.warn('test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log info at INFO level', () => {
      logger.setLevel(LogLevel.INFO);
      logger.info('test info');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log debug at DEBUG level', () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug('test debug');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log debug below DEBUG level', () => {
      logger.setLevel(LogLevel.INFO);
      logger.debug('test debug');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Quiet Mode', () => {
    it('should suppress all output in quiet mode', () => {
      logger.setQuiet(true);
      logger.error('test');
      logger.warn('test');
      logger.info('test');
      logger.debug('test');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
