export const ALLOWED_LICENSE_IDS = Object.freeze([
  'MIT',
  '0BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  'ISC',
]);

const ALLOWED_LICENSE_SET = new Set(ALLOWED_LICENSE_IDS);
const FORBIDDEN_COPYLEFT_PATTERN = /\b(?:AGPL|GPL|LGPL)-[0-9]/iu;
const SPDX_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]*$/u;
const SPDX_TOKEN_PATTERN = /\(|\)|AND|OR|[A-Za-z0-9][A-Za-z0-9.-]*/gu;

function failure(reason, identifiers = []) {
  return { allowed: false, identifiers, reason };
}

/**
 * Evaluate the SPDX expression declared by one dependency.
 * Every identifier in an AND/OR expression must be allowlisted. WITH and '+''
 * suffixes are intentionally rejected until an ADR explicitly permits them.
 */
export function evaluateLicense(rawLicense) {
  if (typeof rawLicense !== 'string' || rawLicense.trim().length === 0) {
    return failure('missing-or-unknown-license');
  }

  const expression = rawLicense.trim();
  if (FORBIDDEN_COPYLEFT_PATTERN.test(expression)) {
    return failure('forbidden-copyleft-license');
  }
  if (/\bWITH\b/u.test(expression)) {
    return failure('license-exception-not-allowlisted');
  }

  const tokens = expression.match(SPDX_TOKEN_PATTERN) ?? [];
  if (tokens.join('') !== expression.replaceAll(/\s+/gu, '')) {
    return failure('invalid-spdx-expression');
  }

  const identifiers = [];
  let cursor = 0;

  const parsePrimary = () => {
    const token = tokens[cursor];
    if (token === '(') {
      cursor += 1;
      if (!parseOrExpression() || tokens[cursor] !== ')') return false;
      cursor += 1;
      return true;
    }
    if (
      token === undefined ||
      !SPDX_IDENTIFIER_PATTERN.test(token) ||
      token === 'AND' ||
      token === 'OR'
    ) {
      return false;
    }
    identifiers.push(token);
    cursor += 1;
    return true;
  };

  const parseAndExpression = () => {
    if (!parsePrimary()) return false;
    while (tokens[cursor] === 'AND') {
      cursor += 1;
      if (!parsePrimary()) return false;
    }
    return true;
  };

  function parseOrExpression() {
    if (!parseAndExpression()) return false;
    while (tokens[cursor] === 'OR') {
      cursor += 1;
      if (!parseAndExpression()) return false;
    }
    return true;
  }

  if (!parseOrExpression() || cursor !== tokens.length || identifiers.length === 0) {
    return failure('invalid-spdx-expression', identifiers);
  }

  const rejected = identifiers.filter((identifier) => !ALLOWED_LICENSE_SET.has(identifier));
  if (rejected.length > 0) {
    return failure(`license-not-allowlisted:${rejected.join(',')}`, identifiers);
  }

  return { allowed: true, identifiers, reason: 'allowlisted' };
}
