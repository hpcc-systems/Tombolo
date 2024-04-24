function wildCardStringMatch(wilCardString, text)
{
    if (wilCardString.length == 0 && text.length == 0)
        return true;

    if (wilCardString.length > 1 && wilCardString[0] == '*' &&
        text.length == 0)
        return false;

    if ((wilCardString.length > 1 && wilCardString[0] == '?') ||
        (wilCardString.length != 0 && text.length != 0 &&
        wilCardString[0] == text[0]))
        return wildCardStringMatch(wilCardString.substring(1),
                    text.substring(1));

    if (wilCardString.length > 0 && wilCardString[0] == '*')
        return wildCardStringMatch(wilCardString.substring(1), text) ||
            wildCardStringMatch(wilCardString, text.substring(1));

    return false;
}

module.exports = wildCardStringMatch;


//Tests
// wilCardStringMatch('*?-*?-*', '20-20-2222') --> true
// wilCardStringMatch('*.csv', '.csv') --> true
// wilCardStringMatch('*?-*?-*.csv', '20-20-2222.csv') --> false
// wilCardStringMatch('*.a*?test*?t**', '.a::salesdata_testcomplete') --> true