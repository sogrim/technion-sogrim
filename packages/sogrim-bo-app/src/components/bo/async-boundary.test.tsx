import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { AsyncBoundary } from "./async-boundary";

function authError(): AxiosError {
  const response = {
    status: 401,
    data: "Permission denied: User not authorized to access this resource",
    statusText: "",
    headers: {},
    config: {},
  } as AxiosResponse;
  return new AxiosError("x", "ERR", undefined, undefined, response);
}

const render401 = () => <div>should not render</div>;

describe("AsyncBoundary", () => {
  it("shows a loading state", () => {
    render(
      <AsyncBoundary isLoading isError={false} error={null} data={undefined}>
        {render401}
      </AsyncBoundary>,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows an access-restricted state for authorization errors", () => {
    render(
      <AsyncBoundary isLoading={false} isError error={authError()} data={undefined}>
        {render401}
      </AsyncBoundary>,
    );
    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
    expect(screen.queryByText("should not render")).not.toBeInTheDocument();
  });

  it("shows a generic error with a working retry button", () => {
    const onRetry = vi.fn();
    render(
      <AsyncBoundary
        isLoading={false}
        isError
        error={new Error("boom")}
        data={undefined}
        onRetry={onRetry}
      >
        {render401}
      </AsyncBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders children with the data when loaded", () => {
    render(
      <AsyncBoundary isLoading={false} isError={false} error={null} data={{ n: 7 }}>
        {(d) => <div>value:{d.n}</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByText("value:7")).toBeInTheDocument();
  });
});
