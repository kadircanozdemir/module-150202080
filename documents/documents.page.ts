import { Component, OnInit } from "@angular/core";
import {
  AngularFireStorage,
  AngularFireUploadTask
} from "@angular/fire/storage";
import {
  AngularFirestore,
  AngularFirestoreCollection
} from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { finalize, tap } from "rxjs/operators";

export interface docData {
  id?: any;
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: "app-documents",
  templateUrl: "./documents.page.html",
  styleUrls: ["./documents.page.scss"]
})
export class DocumentsPage implements OnInit {
  task: AngularFireUploadTask;
  percentage: Observable<number>;
  snapshot: Observable<any>;
  UploadedFileURL: Observable<string>;
  documents: Observable<docData[]>;

  fileName: string;
  fileSize: number;

  isUploading: boolean;
  isUploaded: boolean;

  private documentCollection: AngularFirestoreCollection<docData>;

  constructor(
    private storage: AngularFireStorage,
    private database: AngularFirestore
  ) {
    this.isUploading = false;
    this.isUploaded = false;

    this.documentCollection = database.collection<docData>("documents");
    this.documents = this.documentCollection.valueChanges();
  }

  uploadFile(event: FileList) {
    const file = event.item(0);

    this.isUploading = true;
    this.isUploaded = false;

    this.fileName = file.name;
    const path = `documents/${new Date().getTime()}_${file.name}`;
    const customMetadata = { app: "Document module" };
    const fileRef = this.storage.ref(path);

    this.task = this.storage.upload(path, file, { customMetadata });
    this.percentage = this.task.percentageChanges();
    this.snapshot = this.task.snapshotChanges().pipe(
      finalize(() => {
        this.UploadedFileURL = fileRef.getDownloadURL();

        this.UploadedFileURL.subscribe(
          resp => {
            this.addDocumenttoDB({
              name: file.name,
              filepath: resp,
              size: this.fileSize
            });
            this.isUploading = false;
            this.isUploaded = true;
          },
          error => {
            console.error(error);
          }
        );
      }),
      tap(snap => {
        this.fileSize = snap.totalBytes;
      })
    );
  }

  addDocumenttoDB(document: docData) {
    const id = this.database.createId();
    document.id = id;
    this.documentCollection
      .doc(id)
      .set(document)
      .then(resp => {
        console.log(resp);
      })
      .catch(error => {
        console.log("error " + error);
      });
  }
  deleteDocumentfromDB(document: docData) {
    this.documentCollection
      .doc(document.id)
      .delete()
      .then(resp => {
        alert("silindi");
      })
      .catch(error => {
        console.log("error " + error);
      });
  }
  ngOnInit() {}
}
