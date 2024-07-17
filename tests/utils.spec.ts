import {expect, it, describe} from 'bun:test';
import {validateId} from '../utils';

describe('Identifier validator', () => {
  it('accepts a short id', () => {
    expect(validateId('spoob')).toBe(true);
  });

  it('accepts a typical id', () => {
    expect(validateId('-riQ9Oj4W')).toBe(true);
  });

  it('rejects an id with slashes', () => {
    expect(validateId('roob/crowspoob')).toBe(false);
  });

  it('rejects an empty id', () => {
    expect(validateId('')).toBe(false);
  });

  it('rejects a long id', () => {
    expect(
      validateId(
        'aaeGEGJRJGAEGU234987897gfayhgf98ayg9yf9ydzf9b8d9zfby898zyfuiew98ry9we8yr98ay9fy8diguy98ydsfgyuisdyer89y938yruydifyu98dgiuydriygdryuoiusdygrgyd87ryg8d7ryg87dygiuydkxjhx9c80FASGFAESGaywe9r78y89y87yeg87y8e7yg87yeg87ya8ge7ya8eyg8aey7g87yage87aeg98ua9egu9agu98aue9g8urega87yarg87yar8g7yar87gy'
      )
    ).toBe(false);
  });

  it('fails', () => {
    expect('spoob').toBe('spwares');
  });
});
