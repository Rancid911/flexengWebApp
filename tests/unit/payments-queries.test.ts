import { describe, expect, it } from "vitest";

import {
  getAvailablePaymentPlans as getAvailablePaymentPlansFromFacade,
  getStudentPayments as getStudentPaymentsFromFacade,
  getStudentPaymentStatusContext as getStudentPaymentStatusContextFromFacade,
  getStudentPaymentsPageData as getStudentPaymentsPageDataFromFacade,
  STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING as facadeDescriptor
} from "@/lib/payments/queries";
import {
  getAvailablePaymentPlans,
  getStudentPayments,
  getStudentPaymentStatusContext,
  getStudentPaymentsPageData,
  STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING
} from "@/lib/payments/payments.service";

describe("payments queries compatibility facade", () => {
  it("re-exports the canonical service functions and descriptors", () => {
    expect(getAvailablePaymentPlansFromFacade).toBe(getAvailablePaymentPlans);
    expect(getStudentPaymentsFromFacade).toBe(getStudentPayments);
    expect(getStudentPaymentStatusContextFromFacade).toBe(getStudentPaymentStatusContext);
    expect(getStudentPaymentsPageDataFromFacade).toBe(getStudentPaymentsPageData);
    expect(facadeDescriptor).toBe(STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING);
    expect(facadeDescriptor.transitional).toBe(true);
  });
});
