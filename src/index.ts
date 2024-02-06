export default class Inison {
  private static specialCharsArr = [",", ":", "[", "]", "{", "}"];
  private static specialChars = new Set(Inison.specialCharsArr);
  private static index: number;
  private static s: string;

  static stringify(obj: any): string {
    if (obj === undefined || obj === null) return String(obj);

    if (Array.isArray(obj))
      return "[" + obj.map(Inison.stringify).join(",") + "]";

    if (typeof obj === "object" && obj !== null) {
      const objKeys = Object.keys(obj);
      let result: string[] = [];

      for (const key of objKeys)
        result.push(`${key}:${Inison.stringify(obj[key])}`);

      return `{${result.join(",")}}`;
    }
    obj = String(obj);
    return Inison.specialCharsArr.some((char) => obj.indexOf(char))
      ? Inison.escapeSpecialChars(obj)
      : obj;
  }

  static unstringify(s: string): any {
    if (s === "null") return null;
    if (s === "undefined") return undefined;

    Inison.index = 0;
    Inison.s = s;

    return Inison.parseValue();
  }

  private static parseArray(): any[] {
    const array: any[] = [];
    const len = Inison.s.length;

    Inison.index++; // skip '['
    while (Inison.index < len && Inison.s[Inison.index] !== "]") {
      array.push(Inison.parseValue());
      if (Inison.s[Inison.index] === ",") Inison.index++; // skip ','
    }
    Inison.index++; // skip ']'
    return array;
  }

  private static parseObject(): any {
    const obj: any = {};
    const len = Inison.s.length;

    Inison.index++; // skip '{'
    while (Inison.index < len && Inison.s[Inison.index] !== "}") {
      const [key, value] = Inison.parseKeyValue();
      obj[key] = value;

      if (Inison.s[Inison.index] === ",") Inison.index++; // skip ','
    }
    Inison.index++; // skip '}'
    return obj;
  }

  private static parseKeyValue(): [any, any] {
    const key = Inison.parseValue();

    if (Inison.s[Inison.index] !== ":")
      throw new Error('Expected ":" after key');

    Inison.index++; // skip ':'
    const value = Inison.parseValue();

    return [key, value];
  }

  private static parseValue(): any {
    const len = Inison.s.length;
    const start = Inison.index;

    if (Inison.s[Inison.index] === "[" || Inison.s[Inison.index] === "{")
      return Inison.s[Inison.index] === "["
        ? Inison.parseArray()
        : Inison.parseObject();

    while (
      Inison.index < len &&
      !Inison.specialChars.has(Inison.s[Inison.index])
    )
      Inison.index +=
        Inison.s[Inison.index] === "\\" &&
        Inison.specialChars.has(Inison.s[Inison.index + 1])
          ? 2
          : 1; // Skip both '\\' and ','

    const parsedValue = Inison.s.slice(start, Inison.index);

    if (parsedValue === "") return null;
    else if (parsedValue.indexOf("\\") !== -1)
      return Inison.unescapeSpecialChars(parsedValue);
    else if (parsedValue === "false") return false;
    else if (parsedValue === "null") return null;
    else if (parsedValue === "undefined") return undefined;
    else if (parsedValue === "true") return true;

    const numParsedValue = Number(parsedValue);

    // Check if the parsed value is a number and convert it
    if (Number.isInteger(numParsedValue) && parsedValue !== null)
      return numParsedValue;

    return parsedValue;
  }

  private static unescapeSpecialChars(value: string): string {
    let unescapedValue = "";
    const len = value.length;

    for (let i = 0; i < len; i++) {
      if (value[i] === "\\" && i + 1 < len) {
        const nextChar = value[i + 1];
        if (Inison.specialChars.has(nextChar)) {
          unescapedValue += nextChar;
          i++;
          continue;
        }
      }
      unescapedValue += value[i];
    }

    return unescapedValue;
  }

  private static escapeSpecialChars(value: string): string {
    let escapedValue = "",
      len = value.length;

    for (let i = 0; i < len; i++) {
      const char = value[i];
      if (Inison.specialChars.has(char)) escapedValue += "\\";
      escapedValue += char;
    }

    return escapedValue;
  }
}
