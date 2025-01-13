import { dgraph } from "@hypermode/modus-sdk-as";
import { JSON } from "json-as";
import { File, FileData } from "./file";

// This host name should match one defined in the modus.json manifest file.
const hostName: string = "dgraph";

export function dropAll(): string {
  return dgraph.dropAll(hostName);
}

export function dropAttr(attr: string): string {
  return dgraph.dropAttr(hostName, attr);
}

export function alterSchema(): string {
  const schema = `
  path: string @index(term) .
  fileName: string @index(term) .
  fileExtension: string @index(term) .
  modifiedAt: string @index(term) .
  createdAt: string @index(term) .
  fileContent: string @index(fulltext) .
  dgraph.type: [string] @index(exact) .

  type File {
      path
      fileName
      fileExtension
      modifiedAt
      createdAt
      fileContent
  }
  `;
  return dgraph.alterSchema(hostName, schema);
}

// This function returns the results of querying for all files in the database.
export function queryFiles(): File[] {
  const query = `
  {
    files(func: type(File)) {
      uid
      path
      fileName
      fileExtension
      modifiedAt
      createdAt
      fileContent
    }
  }
  `;

  const resp = dgraph.execute(
    hostName,
    new dgraph.Request(new dgraph.Query(query)),
  );

  return JSON.parse<FileData>(resp.Json).files;
}

// This function returns the results of querying for a specific file in the database.
export function querySpecificFile(path: string, fileName: string): File | null {
  const statement = `
  query queryFile($path: string, $fileName: string) {
    files(func: eq(path, $path)) @filter(eq(fileName, $fileName)) {
        uid
        path
        fileName
        fileExtension
        modifiedAt
        createdAt
        fileContent
    }
}
  `;

  const vars = new dgraph.Variables();
  vars.set("$path", path);
  vars.set("$fileName", fileName);

  const resp = dgraph.execute(
    hostName,
    new dgraph.Request(new dgraph.Query(statement, vars)),
  );

  const files = JSON.parse<FileData>(resp.Json).files;

  if (files.length === 0) return null;
  return files[0];
}

export function addFile(
  path: string,
  fileName: string,
  fileExtension: string,
  modifiedAt: string,
  createdAt: string,
  fileContent: string,
): Map<string, string> | null {
  const file = new File(
    // TODO: Generate a unique ID for the file.
    "_:file1",
    path,
    fileName,
    fileExtension,
    modifiedAt,
    createdAt,
    fileContent,
    ["File"],
  );

  const mutation = JSON.stringify(file);

  const mutations: dgraph.Mutation[] = [new dgraph.Mutation(mutation)];

  return dgraph.execute(hostName, new dgraph.Request(null, mutations)).Uids;
}

export function addFiles(files: File[]): Map<string, string> | null {
  const mutations: dgraph.Mutation[] = files.map(
    (file: File): dgraph.Mutation => {
      const mutation = JSON.stringify(file);
      return new dgraph.Mutation(mutation);
    },
  );

  return dgraph.execute(hostName, new dgraph.Request(null, mutations)).Uids;
}

export function upsertFile(
  pathToChangeFrom: string,
  pathToChangeTo: string,
): Map<string, string> | null {
  const query = `
  query {
    file as var(func: eq(path, "${pathToChangeFrom}"))
  }
  `;
  const mutation = `
    uid(file) <path> "${pathToChangeTo}" .`;

  const dgraphQuery = new dgraph.Query(query);

  const mutationList: dgraph.Mutation[] = [
    new dgraph.Mutation("", "", mutation),
  ];

  const dgraphRequest = new dgraph.Request(dgraphQuery, mutationList);

  const response = dgraph.execute(hostName, dgraphRequest);

  return response.Uids;
}

export function deleteFile(uid: string): Map<string, string> | null {
  const mutation = `<${uid}> * * .`;

  const mutations: dgraph.Mutation[] = [
    new dgraph.Mutation("", "", "", mutation),
  ];

  return dgraph.execute(hostName, new dgraph.Request(null, mutations)).Uids;
}
