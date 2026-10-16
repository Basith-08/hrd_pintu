import type { EmployeeDocumentTemplateData } from "./employeeDocumentTemplateDownload.shared"
import {
  buildFieldTable,
  buildPdfPreviewHtml,
  formatDownloadDate,
  printValue,
  stripLeadingNumberPrefix,
} from "./employeeDocumentTemplateDownload.shared"

export function buildIntegrityPactHtml(data: EmployeeDocumentTemplateData) {
  return buildPdfPreviewHtml({
    title: "Form Pakta Integritas",
    bodyClass: "document integrity-pact",
    bodyHtml: `
      <div class="document-title">
        <span class="document-title__main">PAKTA INTEGRITAS</span>
      </div>

      <p class="intro">Saya yang bertanda tangan di bawah ini:</p>

      ${buildFieldTable(
        [
          { label: "Nama", value: data.employeeName },
          { label: "Jabatan", value: data.mainPosition },
          { label: "Unit Kerja", value: stripLeadingNumberPrefix(data.departmentName) },
        ],
        {
          containerWidth: 460,
          labelWidth: 92,
          valueWidth: 350,
          marginLeft: 34,
          rowHeight: 26,
          fontSize: "11pt",
        },
      )}

      <p>
        Dengan memperhatikan Peraturan Perusahaan yang berlaku dan untuk menjalankan tata kelola
        perusahaan yang baik serta menjunjung tinggi integritas serta etika kerja yang
        profesional, dengan ini saya menyatakan dan berkomitmen untuk melaksanakan hal-hal di
        bawah ini:
      </p>

      <ol type="a" class="commitment-list">
        <li>
          Berkomitmen untuk melaksanakan tugas dan tanggung jawab sesuai tugas pokok, fungsi yang
          ditetapkan Perusahaan dengan sebaik baiknya dan senantiasa menjaga nama baik
          Perusahaan.
        </li>
        <li>
          Tidak melakukan kegiatan apapun yang mengarah ke kegiatan korupsi, kolusi dan nepotisme
          (KKN) dan segala bentuk tindakan lainnya yang bertujuan untuk menghasilkan keuntungan
          pribadi/kelompok dalam bentuk apapun.
        </li>
        <li>
          Tidak menerima hadiah, uang, fasilitas, komisi, potongan/discount, pengembalian/rebate
          atau segala bentuk hal lainnya dari pihak eksternal yang mempunyai hubungan bisnis, baik
          langsung maupun tidak langsung, dengan Perusahaan untuk mendapatkan keuntungan
          pribadi/kelompok.
        </li>
        <li>
          Tidak memberikan hadiah, uang, komisi atau barang yang diperoleh dari dana Perusahaan
          dan/atau tidak memberikan fasilitas, preferensi atau hak-hak istimewa lainnya kepada
          pihak eksternal yang mempunyai hubungan bisnis, baik langsung maupun tidak langsung,
          dengan Perusahaan untuk mendapatkan keuntungan pribadi/kelompok.
        </li>
        <li>
          Tidak akan merekayasa, memanipulasi, merubah, memalsukan, dan atau menghapus dokumen,
          surat, laporan, administrasi keuangan dan atau surat administrasi lainnya untuk
          kepentingan diri sendiri/kelompok dan/atau pihak lain tanpa kecuali.
        </li>
        <li>
          Tidak akan melibatkan, secara langsung maupun tidak langsung, anggota keluarga dan/atau
          pihak yang berpotensi menimbulkan benturan kepentingan (conflict of interest) dalam
          kegiatan yang berhubungan dengan Perusahaan, baik sebagai vendor, technical assistance,
          konsultan, advisor maupun peranan lainnya.
        </li>
        <li>
          Bersikap transparan, jujur, obyektif dan akuntabel dalam pelaksanaan tugas dengan tetap
          menjaga kerahasiaan Perusahaan sesuai ketentuan yang berlaku dan akan melaporkan kepada
          pejabat berwenang apabila menemukan indikasi pelanggaran.
        </li>
        <li>
          Berkomitmen untuk memperlakukan data/informasi/dokumen Perusahaan sebagai
          data/informasi/dokumen rahasia dan tidak akan mengungkapkan, memberikan atau menjual
          data/informasi/dokumen Perusahaan kepada pihak lain baik secara langsung maupun tidak
          langsung.
        </li>
        <li>
          Tidak menjadi pengurus atau karyawan pada perusahaan lain yang terlibat dalam kegiatan
          operasional sehari-hari.
        </li>
        <li>
          Selama jadwal kerja yang ditentukan Perusahaan, tidak menggunakan waktu kerja untuk
          melakukan kegiatan atau aktivitas yang berkaitan dengan usaha kerja sampingan dan/atau
          kegiatan-kegiatan lain yang tidak berhubungan dengan pekerjaan yang ditetapkan oleh
          Perusahaan.
        </li>
        <li>
          Tidak akan mengambil atau membawa pulang peralatan, perlengkapan dan/atau barang milik
          Perusahaan baik yang secara aktif digunakan maupun yang sudah tidak terpakai lagi tanpa
          persetujuan tertulis dari pejabat berwenang.
        </li>
        <li>
          Tidak akan melakukan perbuatan asusila, mengedarkan bahan/informasi yang bersifat
          pornografi, melakukan tindak pelecehan seksual terhadap pihak lain dalam bentuk tindakan
          verbal maupun non verbal selama berada di dalam lingkungan kerja dan kantor.
        </li>
        <li>
          Tidak akan mempengaruhi dan/atau memprovokasi pimpinan, sesama kolega kerja, maupun
          bawahan di Perusahaan untuk maksud-maksud tertentu yang mengganggu stabilitas
          Perusahaan atau berkomplot untuk melakukan hal-hal yang tidak dibenarkan oleh
          Perusahaan yang berpotensi merugikan Perusahaan.
        </li>
        <li>
          Tidak akan melakukan tindakan menghasut, menimbulkan huru-hara dan menyebarkan
          berita-berita yang dapat menimbulkan keresahan, pertentangan, konflik berbau SARA di
          dalam lingkungan kerja dan kantor.
        </li>
        <li>
          Tidak akan melakukan unjuk rasa dalam bentuk orasi, provokasi, deklarasi bersama yang
          menggunakan atribut Perusahaan dan/atau melibatkan karyawan ataupun orang lain di luar
          Perusahaan selama berada di lingkungan kerja dan kantor.
        </li>
        <li>
          Bersedia untuk menerima sanksi dan konsekuensi lain yang timbul dari pelanggaran
          hal-hal yang tercantum dalam Peraturan Perusahaan dan Pakta Integritas.
        </li>
      </ol>

      <p>
        Demikian Pakta Integritas ini saya buat dalam kondisi sehat walafiat secara jasmani dan
        rohani, dengan sukarela, dan tanpa ada paksaan dalam bentuk apapun dari pihak manapun,
        sebagai bentuk komitmen terhadap Perusahaan. Saya berjanji dan berkomitmen untuk
        melaksanakan Pakta Integritas ini dengan baik. Dalam hal di kemudian hari ditemukan
        adanya kegiatan saya yang menyimpang atau melanggar satu atau lebih isi Pakta Integritas
        diatas, maka saya mengerti dan menerima konsekuensi yang muncul mulai dari teguran,
        peringatan tertulis, pemutusan hubungan kerja, sampai dengan munculnya tuntutan hukum
        baik pidana maupun perdata sesuai dengan derajat pelanggaran yang dilakukan dan
        membebaskan Perusahaan dari segala bentuk tuntutan hukum serta secara sukarela
        melepaskan seluruh hak kepegawaian yang ada serta membebaskan Perusahaan dari segala
        kewajiban terkait hak kepegawaian secara menyeluruh.
      </p>

      <div class="signature-block">
        <p>Jakarta, ${formatDownloadDate(new Date())}</p>
        <p>Yang membuat pernyataan,</p>
        <p class="stamp">Materai</p>
        <p>${printValue(data.employeeName)}</p>
      </div>
    `,
  })
}
