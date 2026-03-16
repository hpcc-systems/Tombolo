function wildCardStringMatch(wilCardString: string, text: string): boolean {
  if (wilCardString.length === 0 && text.length === 0) return true;

  if (wilCardString.length > 1 && wilCardString[0] === '*' && text.length === 0)
    return false;

  if (
    (wilCardString.length > 1 && wilCardString[0] === '?') ||
    (wilCardString.length != 0 &&
      text.length != 0 &&
      wilCardString[0] == text[0])
  )
    return wildCardStringMatch(wilCardString.substring(1), text.substring(1));

  if (wilCardString.length > 0 && wilCardString[0] === '*')
    return (
      wildCardStringMatch(wilCardString.substring(1), text) ||
      wildCardStringMatch(wilCardString, text.substring(1))
    );

  return false;
}

export default wildCardStringMatch;

//Tests
// wildCardStringMatch('*?-*?-*', '20-20-2222');
// wildCardStringMatch('*.csv', '.csv') --> true
// wildCardStringMatch('*?-*?-*.csv', '20-20-2222.csv') --> false
// wildCardStringMatch('*.a*?test*?t**', '.a::salesdata_testcomplete') --> true
