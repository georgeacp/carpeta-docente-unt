"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/tailgrids/core/avatar";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/tailgrids/core/input-group";
import { Label } from "@/components/tailgrids/core/label";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { TextArea } from "@/components/tailgrids/core/text-area";
import { TextField } from "@/components/tailgrids/core/text-field";
import { useI18n } from "@/context/i18n-context";
import Image from "next/image";
import { FieldError, Form } from "react-aria-components";
import { LogoutIcon, TrashIcon } from "./icons";

const countryOptions = [
  { value: "us", label: "United States", flag: "/images/flag/US.svg" },
  { value: "ca", label: "Canada", flag: "/images/flag/CA.svg" },
  { value: "fr", label: "France", flag: "/images/flag/FR.svg" },
  { value: "au", label: "Australia", flag: "/images/flag/AU.svg" },
  { value: "it", label: "Italy", flag: "/images/flag/IT.svg" },
  { value: "in", label: "India", flag: "/images/flag/IN.svg" },
];

export default function AccountPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Account Details Card */}
      <Card className="bg-transparent p-5">
        <h2 className="mb-6 text-xl leading-7 font-semibold text-text-primary">
          {t("profile.accountDetails")}
        </h2>

        <Form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <div className="flex items-center gap-4">
            <Avatar size="xxl">
              <AvatarImage src="/images/user/jhon-smith.png" alt="Jhon Smith" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <Button appearance="outline" size="sm">
                  {t("profile.changeAvatar")}
                </Button>
                <Button appearance="outline" variant="danger" size="sm">
                  {t("profile.remove")}
                </Button>
              </div>
              <p className="text-xs leading-4 text-text-tertiary">
                {t("profile.avatarHint")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TextField className="w-full gap-2.5">
              <Label>{t("profile.fullName")}</Label>
              <Input name="fullName" placeholder="Jhon Smith" className="w-full" required />
              <FieldError />
            </TextField>

            <TextField className="w-full gap-2.5">
              <Label>{t("profile.email")}</Label>
              <Input
                name="email"
                type="email"
                placeholder="jhon@example.com"
                className="w-full"
                required
              />
              <FieldError />
            </TextField>

            <TextField className="w-full gap-2.5">
              <Label>{t("profile.phone")}</Label>
              <Input name="phone" placeholder="+1 604 555 1234" className="w-full" />
            </TextField>

            <TextField className="w-full gap-2.5">
              <Label>{t("profile.website")}</Label>
              <InputGroup>
                <InputGroupAddon className="after h-full border-r border-card-border text-input-placeholder-text-color">
                  https://
                </InputGroupAddon>
                <InputGroupInput name="website" placeholder="www.unitru.edu.pe" className="pl-2" />
              </InputGroup>
            </TextField>

            <TextField className="w-full gap-2.5">
              <Label>{t("profile.address")}</Label>
              <Input
                name="address"
                placeholder="1901 Thornridge Cir. Shiloh, Hawaii 81063"
                className="w-full"
              />
            </TextField>

            <div>
              <Select name="country" defaultSelectedKey="us" className="h-full">
                <SelectLabel>{t("profile.country")}</SelectLabel>
                <SelectTrigger className="h-full w-full border-input-border">
                  <SelectValue className="flex items-center gap-2" />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.value} id={option.value} textValue={option.label}>
                      <span className="flex items-center gap-2">
                        <Image
                          src={option.flag}
                          alt={option.label}
                          width={20}
                          height={20}
                          className="size-5 rounded-full object-cover"
                        />
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TextField className="col-span-1 w-full gap-2.5 md:col-span-2">
              <Label>{t("profile.bio")}</Label>
              <TextArea
                name="bio"
                className="h-25 shadow-xs"
                placeholder="Passionate software engineer with a knack for crafting scalable web applications and exploring cutting-edge technologies. Always eager to solve complex problems and innovate."
              />
            </TextField>

            <div className="col-span-1 flex items-center justify-end gap-3 md:col-span-2">
              <Button
                appearance="outline"
                variant="primary"
                size="lg"
                type="button"
                className="px-3.5 text-sm"
              >
                {t("common.cancel")}
              </Button>
              <Button variant="primary" size="lg" type="submit" className="px-3.5 text-sm">
                {t("common.saveChanges")}
              </Button>
            </div>
          </div>
        </Form>
      </Card>

      <Card className="bg-transparent p-5">
        {/* Sign Out */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-sm leading-5 font-medium text-text-primary">
              {t("profile.signOutAllDevices")}
            </p>
            <p className="text-xs leading-4 text-text-tertiary">
              {t("profile.signOutAllDesc")}
            </p>
          </div>

          <Button
            appearance="outline"
            variant="primary"
            size="lg"
            className="gap-2 px-3.5 py-2 text-sm [&>svg]:size-5"
          >
            <LogoutIcon />
            {t("common.logout")}
          </Button>
        </div>
        <hr className="my-4 border-border-secondary-alt" />
        {/* Delete Account */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-sm leading-5 font-medium text-text-primary">
              {t("profile.deleteAccount")}
            </p>
            <p className="text-xs leading-4 text-text-tertiary">
              {t("profile.deleteAccountDesc")}
            </p>
          </div>

          <Button
            appearance="outline"
            variant="danger"
            size="lg"
            className="gap-2 px-3.5 text-sm [&>svg]:size-5"
          >
            <TrashIcon />
            {t("profile.deleteAccount")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
