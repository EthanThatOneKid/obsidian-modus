
@json
export class File {
  constructor(
    uid: string = "",
    path: string = "",
    fileName: string = "",
    fileExtension: string = "",
    modifiedAt: string = "",
    createdAt: string = "",
    fileContent: string = "",
    dType: string[] = [],
  ) {
    this.uid = uid;
    this.path = path;
    this.fileName = fileName;
    this.fileExtension = fileExtension;
    this.modifiedAt = modifiedAt;
    this.createdAt = createdAt;
    this.fileContent = fileContent;
    this.dType = dType;
  }
  uid: string = "";
  path: string = "";
  fileName: string = "";
  fileExtension: string = "";
  modifiedAt: string = "";
  createdAt: string = "";
  fileContent: string = "";


  @alias("dgraph.type")
  dType: string[] = [];
}


@json
export class FileData {
  files!: File[];
}
