/**
 * Utilidad para generar texto aleatorio que reemplace el contenido real
 * cuando un usuario no está autenticado
 */

// Palabras aleatorias sin sentido para generar texto
const RANDOM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'semper', 'viverra',
  'nam', 'libero', 'justo', 'laoreet', 'mauris', 'cursus', 'mattis', 'molestie',
  'orci', 'sagittis', 'eu', 'volutpat', 'odio', 'facilisis', 'leo', 'vel',
  'fringilla', 'est', 'ullamcorper', 'eget', 'nulla', 'facilisi', 'etiam',
  'dignissim', 'diam', 'quis', 'enim', 'lobortis', 'scelerisque', 'fermentum'
];

// Caracteres aleatorios para reemplazar texto sensible
const RANDOM_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

/**
 * Genera una palabra aleatoria de la lista
 */
function getRandomWord(): string {
  return RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];
}

/**
 * Genera un párrafo de Lorem Ipsum de longitud específica
 */
export function generateRandomParagraph(wordCount: number = 50): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(getRandomWord());
  }
  
  // Capitalizar la primera palabra
  if (words.length > 0) {
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }
  
  return words.join(' ') + '.';
}

/**
 * Reemplaza el contenido HTML con texto aleatorio manteniendo la estructura
 */
export function obfuscateHtmlContent(htmlContent: string): string {
  // Reemplazar texto entre etiquetas HTML pero mantener las etiquetas
  const textRegex = />([^<]+)</g;
  
  return htmlContent.replace(textRegex, (match, textContent) => {
    // Si es solo espacios en blanco, no cambiar
    if (textContent.trim().length === 0) {
      return match;
    }
    
    // Contar palabras aproximadas en el texto original
    const originalWords = textContent.trim().split(/\s+/).length;
    const randomText = generateRandomParagraph(Math.max(1, originalWords));
    
    return `>${randomText}<`;
  });
}

/**
 * Genera texto aleatorio que mantiene la longitud aproximada del original
 */
export function generateRandomText(originalText: string): string {
  const originalLength = originalText.length;
  const wordsNeeded = Math.ceil(originalLength / 6); // Aproximadamente 6 caracteres por palabra
  
  return generateRandomParagraph(Math.max(1, wordsNeeded));
}

/**
 * Convierte markdown a texto aleatorio manteniendo la estructura básica
 */
export function obfuscateMarkdownContent(markdownContent: string): string {
  return markdownContent
    // Mantener headers pero cambiar el texto
    .replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, title) => {
      const randomTitle = generateRandomParagraph(Math.max(1, title.split(' ').length));
      return `${hashes} ${randomTitle}`;
    })
    // Reemplazar contenido de párrafos
    .replace(/^(?!#|```|[-*+]|\d+\.|\s*$)(.+)$/gm, (match, paragraph) => {
      const words = paragraph.split(' ').length;
      return generateRandomParagraph(Math.max(1, words));
    })
    // Reemplazar texto en listas
    .replace(/^([-*+]|\d+\.)\s+(.+)$/gm, (match, bullet, content) => {
      const words = content.split(' ').length;
      return `${bullet} ${generateRandomParagraph(Math.max(1, words))}`;
    });
}

/**
 * Genera un hash simple basado en el slug para hacer el contenido predecible
 * pero no relacionado con el contenido real
 */
export function generateSeedFromSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    const char = slug.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Genera contenido aleatorio pero consistente para un slug específico
 */
export function generateConsistentRandomContent(slug: string, contentLength: number = 500): string {
  // Usar el slug como semilla para hacer el contenido consistente
  const seed = generateSeedFromSlug(slug);
  
  // Hacer que Math.random sea determinístico temporalmente
  const originalRandom = Math.random;
  let currentSeed = seed;
  Math.random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  const wordsNeeded = Math.ceil(contentLength / 6);
  const randomContent = generateRandomParagraph(wordsNeeded);
  
  // Restaurar Math.random original
  Math.random = originalRandom;
  
  return randomContent;
}