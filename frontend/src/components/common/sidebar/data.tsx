import React from "react";
import { HomeIcon, TableIcon, UserIcon, Widget4Icon, WindowIcon } from "./icon";

export interface NavChildItem {
  title: string;
  url: string;
}

export interface NavItemData {
  title: string;
  url?: string;
  icon?: React.ReactNode;
  items?: NavChildItem[];
}

export interface NavSectionData {
  label: string;
  items: NavItemData[];
}

export function getNavDataByRole(
  rol?: string | null,
  t?: (key: string) => string,
): NavSectionData[] {
  const tr = (key: string, fallback: string) => (t ? t(key) : fallback);

  if (rol === "docente") {
    return [
      {
        label: tr("nav.teacherStation", "ESTACIÓN DOCENTE"),
        items: [
          {
            title: tr("nav.myFoldersAndCourses", "Mis Carpetas y Cursos"),
            url: "/docente",
            icon: <WindowIcon />,
            items: [],
          },
        ],
      },
      {
        label: tr("nav.accreditationAndQuality", "ACREDITACIÓN & CALIDAD"),
        items: [
          {
            title: tr("nav.myProfile", "Mi Perfil Institucional"),
            url: "/profile",
            icon: <UserIcon />,
            items: [],
          },
        ],
      },
    ];
  }

  if (rol === "revisor") {
    return [
      {
        label: tr("nav.supervisionAndRuling", "SUPERVISIÓN Y DICTAMEN"),
        items: [
          {
            title: tr("modules.inbox", "Entregas pendientes"),
            url: "/revisor",
            icon: <TableIcon />,
            items: [],
          },
          {
            title: tr("modules.tracking", "Seguimiento"),
            url: "/revisor/seguimiento",
            icon: <TableIcon />,
            items: [],
          },
          {
            title: tr("modules.myFolders", "Mis carpetas"),
            url: "/docente",
            icon: <WindowIcon />,
            items: [],
          },
        ],
      },
      {
        label: tr("nav.institutionalControl", "CONTROL INSTITUCIONAL"),
        items: [
          {
            title: tr("nav.myProfile", "Mi Perfil Institucional"),
            url: "/profile",
            icon: <UserIcon />,
            items: [],
          },
        ],
      },
    ];
  }

  if (rol === "admin") {
    return [
      {
        label: tr("nav.academicAdministration", "ADMINISTRACIÓN ACADÉMICA"),
        items: [
          {
            title: tr("nav.adminConsole", "Consola Administrativa"),
            url: "/admin",
            icon: <Widget4Icon />,
            items: [],
          },
          ...[
            "usuarios",
            "cursos",
            "semestres",
            "asignaciones",
            "configuracion",
          ].map((section) => ({
            title: tr(`modules.${section}`, section),
            url: `/admin/${section}`,
            icon: <Widget4Icon />,
            items: [],
          })),
        ],
      },
      {
        label: tr("nav.systemSection", "SISTEMA"),
        items: [
          {
            title: tr("nav.myProfile", "Mi Perfil Institucional"),
            url: "/profile",
            icon: <UserIcon />,
            items: [],
          },
        ],
      },
    ];
  }

  // Invitado o sin sesión
  return [
    {
      label: tr("nav.systemAccess", "ACCESO AL SISTEMA"),
      items: [
        {
          title: tr("nav.login", "Iniciar Sesión"),
          url: "/login",
          icon: <HomeIcon />,
          items: [],
        },
      ],
    },
  ];
}

// Compatibilidad por defecto
export const NAV_DATA: NavSectionData[] = getNavDataByRole("docente");
