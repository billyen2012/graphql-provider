const flattenJsonKeyToArray = (inputObject) => {
  const tempObj = {};
  const iterate = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] !== "object") {
        tempObj[key] = "";
      } else {
        tempObj[key] = "";
        iterate(obj[key]);
      }
    }
  };

  iterate(inputObject);
  return Object.keys(tempObj);
};

const gqlQueryKeyParser = (data = "") => {
  if (!data) return;
  const a = data
    .split("\n")
    .reduce((a, b) => {
      if (b.includes("{")) return (a += `"${b.replace("{", '"{')}`);
      if (b.includes("}")) return (a += b + ",");
      return (a = a + `"${b}":"",`);
    })
    .replace("query", "")
    .slice(0, -1)
    .replace(/\s/g, "");

  const b = a.split("{");
  b[0] = `"${b[0]}"`;
  const c = "{" + b.join(":{") + "}";
  const d = c
    .split("}")
    .map((part) => (part[part.length - 1] === "," ? part.slice(0, -1) : part))
    .join("}");
  const e = JSON.parse(d);
  const f = flattenJsonKeyToArray(e);

  return { queryJson: e, searchKeys: f };
};

module.exports = {
  gqlQueryKeyParser,
};
