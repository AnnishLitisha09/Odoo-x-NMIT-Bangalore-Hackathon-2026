const { getCompanyInitials, getNamePart, generateLoginId } = require('../utils/loginIdGenerator');

describe('Login ID Generator Utilities', () => {
  describe('getCompanyInitials', () => {
    test('should extract initials for multi-word company names', () => {
      expect(getCompanyInitials('Odoo India')).toBe('OI');
      expect(getCompanyInitials('Adamas University Technology')).toBe('AU');
    });

    test('should extract initials for single-word company names', () => {
      expect(getCompanyInitials('Google')).toBe('GO');
      expect(getCompanyInitials('V')).toBe('VX');
    });

    test('should handle empty/null company names', () => {
      expect(getCompanyInitials(null)).toBe('HR');
      expect(getCompanyInitials('')).toBe('HR');
    });
  });

  describe('getNamePart', () => {
    test('should combine first 2 letters of first and last name', () => {
      expect(getNamePart('John', 'Doe')).toBe('JODO');
      expect(getNamePart('Alice', 'Smith')).toBe('ALSM');
    });

    test('should pad with X if names are too short', () => {
      expect(getNamePart('J', 'D')).toBe('JXDX');
      expect(getNamePart('A', '')).toBe('AXXX');
    });

    test('should strip non-alphabetic characters', () => {
      expect(getNamePart('J.O.', 'D-O')).toBe('JODO');
    });
  });

  describe('generateLoginId', () => {
    test('should generate expected ID with count mock', async () => {
      const mockEmployeeModel = {
        count: jest.fn().mockResolvedValue(0)
      };

      const loginId = await generateLoginId('John', 'Doe', '2022-05-15', 'Odoo India', mockEmployeeModel);
      expect(loginId).toBe('OIJODO20220001');
      expect(mockEmployeeModel.count).toHaveBeenCalled();
    });

    test('should increment serial based on existing count for the year', async () => {
      const mockEmployeeModel = {
        count: jest.fn().mockResolvedValue(15)
      };

      const loginId = await generateLoginId('Alice', 'Smith', '2026-07-04', 'Adamas University', mockEmployeeModel);
      expect(loginId).toBe('AUALSM20260016');
    });
  });
});
