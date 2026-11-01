import { PROJECT_MAILTO } from '../src/utils/projectContact';

describe('AuthorSignature mailto', () => {
  it('points to the projects inbox with encoded subject and body', () => {
    expect(PROJECT_MAILTO.startsWith('mailto:chepriapps@gmail.com?subject=')).toBe(true);
    const params = new URLSearchParams(PROJECT_MAILTO.split('?')[1]);
    expect(params.get('subject')).toBe('Tengo un proyecto en mente');
    expect(params.get('body')).toContain('He usado la app de reservas de pádel');
    expect(PROJECT_MAILTO).not.toMatch(/ /);
  });
});
